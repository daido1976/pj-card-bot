// TODO: 最小の実装から始めた方が良いかも
use crate::logger::Logger;
pub use github_types as types;

pub use types::{AppEvent, Event, EventType};

use std::convert::{From, Infallible};
use std::fmt;
use std::net::SocketAddr;
use std::str::{from_utf8, FromStr};

use crypto_mac::MacError;
use derive_more::{Display, From};
use futures::{future, Future, StreamExt};
use hmac::{Hmac, Mac, NewMac};
use hyper::{
    header::{self, HeaderValue},
    http::StatusCode,
    server::conn::AddrStream,
    service::make_service_fn,
    service::Service,
    Body, Request, Response, Server,
};
use sha2::Sha256;

// Re-export these to avoid forcing users to add a dependency on hubcaps.
use futures::task::{Context, Poll};
use std::pin::Pin;

#[derive(From, Display)]
pub enum PayloadError {
    Hyper(hyper::Error),
    Json(serde_json::Error),
    Mac(MacError),
}

#[derive(Display)]
pub enum Error {
    #[display(fmt = "Invalid or missing Content-Type")]
    ContentType,

    #[display(fmt = "Invalid X-Github-Event")]
    InvalidEvent,

    #[display(fmt = "Missing X-Github-Event")]
    MissingEvent,

    #[display(fmt = "Missing X-Hub-Signature")]
    MissingSignature,

    #[display(fmt = "Invalid X-Hub-Signature")]
    InvalidSignature,

    #[display(fmt = "HTTP Error")]
    Http(hyper::http::Error),

    Payload(PayloadError),
}

impl From<hyper::Error> for Error {
    fn from(e: hyper::Error) -> Self {
        Error::Payload(PayloadError::Hyper(e))
    }
}

impl From<serde_json::Error> for Error {
    fn from(e: serde_json::Error) -> Self {
        Error::Payload(PayloadError::Json(e))
    }
}

impl From<MacError> for Error {
    fn from(e: MacError) -> Self {
        Error::Payload(PayloadError::Mac(e))
    }
}

impl From<hyper::http::Error> for Error {
    fn from(e: hyper::http::Error) -> Self {
        Error::Http(e)
    }
}

/// A trait that a Github app must implement.
pub trait GithubApp: Clone {
    type Error: fmt::Display;
    type Future: Future<Output = Result<(), Self::Error>> + Send;

    /// The secret that was created when the app was created. This is used to
    /// verify that webhook payloads are really coming from GitHub.
    ///
    /// If this returns `None` (the default), then signatures are not verified
    /// for payloads.
    fn secret(&self) -> Option<&str> {
        None
    }

    /// Called when an event is received.
    fn call(&mut self, payload: Event) -> Self::Future;
}

/// Wraps an app in a Hyper service which can be used to run the server.
pub struct App<T> {
    app: T,
}

impl<T> App<T> {
    pub fn new(app: T) -> Self {
        App { app }
    }
}

impl<T: GithubApp> App<T> {
    async fn handle_request(
        mut app: T,
        req: Request<Body>,
    ) -> Result<Response<Body>, hyper::http::Error> {
        let payload = match Self::parse_request(req, app.secret()).await {
            Ok(p) => p,
            Err(err) => {
                return Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .body(err.to_string().into())
            }
        };

        if let Err(err) = app.call(payload).await {
            return Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(err.to_string().into());
        };

        // return 200 ok
        Response::builder()
            .status(StatusCode::OK)
            .body(Body::empty())
    }

    /// Parses a Hyper request for a Github event.
    async fn parse_request(req: Request<Body>, secret: Option<&str>) -> Result<Event, Error> {
        if req.headers().get(header::CONTENT_TYPE)
            != Some(&HeaderValue::from_static("application/json"))
        {
            return Err(Error::ContentType);
        }

        // Parse the event type.
        let event = req
            .headers()
            .get("X-Github-Event")
            .ok_or(Error::MissingEvent)
            .and_then(move |header| {
                from_utf8(header.as_bytes())
                    .map_err(|_| Error::InvalidEvent)
                    .and_then(|s| EventType::from_str(s).map_err(|_| Error::InvalidEvent))
            })?;

        let buf = Self::verify_request(req, secret).await?;

        Self::parse_event(event, &buf).map_err(Error::from)
    }

    /// Verify request.
    ///
    /// This handles hmac signature verification to ensure that the payload actually came from Github.
    async fn verify_request(
        req: Request<Body>,
        secret: Option<&str>,
    ) -> Result<Vec<u8>, crate::github_app::Error> {
        type HmacSha256 = Hmac<Sha256>;
        // TODO: uncomment
        // let signature = req
        //     .headers()
        //     .get("X-Hub-Signature-256")
        //     .ok_or(Error::MissingSignature)
        //     .and_then(move |header| {
        //         from_utf8(header.as_bytes())
        //             .map_err(|_| Error::InvalidSignature)
        //             .and_then(|s| Signature::from_str(s).map_err(|_| Error::InvalidSignature))
        //     })?;
        let mut mac: Option<HmacSha256> =
            secret.map(|s| HmacSha256::new_from_slice(s.as_bytes()).unwrap());
        let mut buf = Vec::new();
        let mut body = req.into_body();
        // TODO: もう少しシンプルにできるはず
        while let Some(chunk) = body.next().await {
            let chunk = chunk?;

            if let Some(mac) = mac.as_mut() {
                mac.update(&chunk);
            }

            buf.extend(chunk);
        }
        // TODO: uncomment
        // if let Some(mac) = mac {
        //     mac.verify(signature.digest())?;
        // }
        Ok(buf)
    }

    fn parse_event(event_type: EventType, slice: &[u8]) -> Result<Event, serde_json::Error> {
        Ok(match event_type {
            EventType::Issues => Event::Issues(serde_json::from_slice(slice)?),
            EventType::PullRequest => Event::PullRequest(serde_json::from_slice(slice)?),
            _ => panic!("Unimplemented event type: {}", event_type),
        })
    }
}

impl<T> Service<Request<Body>> for App<T>
where
    T: GithubApp + Sync + Send + 'static,
{
    type Response = Response<Body>;
    type Error = hyper::http::Error;
    #[allow(clippy::type_complexity)]
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, _cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, req: Request<Body>) -> Self::Future {
        let app = self.app.clone();
        let response = Self::handle_request(app, req);
        Box::pin(response)
    }
}

/// Webhook signature.
#[derive(Debug, Clone)]
struct Signature {
    digest: Vec<u8>,
}

impl Signature {
    pub fn new(digest: Vec<u8>) -> Signature {
        Signature { digest }
    }

    pub fn digest(&self) -> &[u8] {
        &self.digest
    }
}

impl FromStr for Signature {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut splits = s.trim().splitn(2, '=');

        match (splits.next(), splits.next()) {
            (Some(method), Some(digest)) => {
                // GitHub doesn't use anything else besides sha1 at the moment.
                if method != "sha1" {
                    return Err(());
                }

                Ok(Signature::new(hex::decode(digest).map_err(|_| ())?))
            }
            _ => Err(()),
        }
    }
}

pub fn server<T>(addr: &SocketAddr, app: T) -> impl Future<Output = Result<(), hyper::Error>>
where
    T: GithubApp + Sync + Send + Unpin + 'static,
{
    // Create our service factory.
    let new_service = make_service_fn(move |socket: &AddrStream| {
        // Create our app.
        let service = App::new(app.clone());

        // Add logging middleware
        let service = Logger::new(socket.remote_addr(), service);

        future::ready(Ok::<_, Infallible>(service))
    });

    // Create the server.
    let server = Server::bind(addr).serve(new_service);

    log::info!("Listening on {}", server.local_addr());

    server
}
