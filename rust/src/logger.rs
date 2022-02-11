use std::fmt;
use std::net::SocketAddr;
use std::time::Instant;

use futures::task::{Context, Poll};
use futures::Future;
use humantime::format_duration;
use hyper::{service::Service, Request, Response};
use std::pin::Pin;

/// Wraps a service to provide logging on both the request and the response.
pub struct Logger<S> {
    remote_addr: SocketAddr,
    service: S,
}

impl<S> Logger<S> {
    pub fn new(remote_addr: SocketAddr, service: S) -> Self {
        Logger {
            remote_addr,
            service,
        }
    }
}

impl<S, B, RB> Service<Request<B>> for Logger<S>
where
    B: Send,
    S: Service<Request<B>, Response = Response<RB>> + Send,
    S::Future: Send + 'static,
    S::Error: fmt::Display + Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    #[allow(clippy::type_complexity)]
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, _cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, req: Request<B>) -> Self::Future {
        let method = req.method().clone();
        let uri = req.uri().clone();
        let remote_addr = self.remote_addr;

        let start = Instant::now();

        let response = self.service.call(req);

        let response = async move {
            let response = response.await;

            match &response {
                Ok(response) => log::info!(
                    "[{}] {} {} - {} ({})",
                    remote_addr.ip(),
                    method,
                    uri,
                    response.status(),
                    format_duration(start.elapsed()),
                ),
                Err(err) => log::error!(
                    "[{}] {} {} - {} ({})",
                    remote_addr.ip(),
                    method,
                    uri,
                    err,
                    format_duration(start.elapsed()),
                ),
            };

            response
        };

        Box::pin(response)
    }
}
