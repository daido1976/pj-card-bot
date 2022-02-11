mod github_app;
mod logger;

use std::net::SocketAddr;
use std::pin::Pin;
use std::{env, io};

use futures::{future, Future};
use github_app::{Event, GithubApp};

#[derive(Clone)]
struct PjCardBot;

impl GithubApp for PjCardBot {
    type Error = io::Error;
    type Future = Pin<Box<dyn Future<Output = Result<(), Self::Error>> + Send>>;

    fn webhook_secret(&self) -> String {
        env::var("WEBHOOK_SECRET").expect("Webhook secret must be provided")
    }

    fn call(&mut self, event: Event) -> Self::Future {
        println!("{:#?}", event);
        Box::pin(future::ok(()))
    }
}

#[tokio::main]
async fn main() {
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    if let Err(err) = github_app::server(&addr, PjCardBot).await {
        println!("{}", err)
    }
}
