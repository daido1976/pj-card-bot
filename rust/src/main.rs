mod github_app;
mod logger;

use std::io;
use std::net::SocketAddr;
use std::pin::Pin;

use futures::{future, Future};
use github_app::{Event, GithubApp};

#[derive(Clone)]
struct MyApp;

impl GithubApp for MyApp {
    type Error = io::Error;
    type Future = Pin<Box<dyn Future<Output = Result<(), Self::Error>> + Send>>;

    fn webhook_secret(&self) -> Option<&str> {
        // TODO: 環境変数から取得させる
        Some("development")
    }

    fn call(&mut self, event: Event) -> Self::Future {
        println!("{:#?}", event);
        Box::pin(future::ok(()))
    }
}

#[tokio::main]
async fn main() {
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    if let Err(err) = github_app::server(&addr, MyApp).await {
        println!("{}", err)
    }
}
