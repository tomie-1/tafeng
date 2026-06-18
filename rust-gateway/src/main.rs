use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Serialize)]
struct Health {
    service: &'static str,
    ok: bool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter("tafeng_gateway=info,tower_http=info")
        .init();

    let app = Router::new()
        .route("/health", get(health))
        .route("/ssh", get(ssh_socket))
        .route("/sftp/upload", post(upload_placeholder))
        .route("/sftp/download", get(download_placeholder))
        .layer(CorsLayer::permissive());

    let address = SocketAddr::from(([127, 0, 0, 1], 9090));
    tracing::info!("tafeng rust gateway listening on {address}");
    let listener = tokio::net::TcpListener::bind(address).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> Json<Health> {
    Json(Health {
        service: "tafeng-gateway",
        ok: true,
    })
}

async fn ssh_socket(upgrade: WebSocketUpgrade) -> impl IntoResponse {
    upgrade.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    let _ = socket
        .send(Message::Text(
            "Tafeng Rust gateway placeholder. Wire russh/openssh here.\r\n".into(),
        ))
        .await;

    while let Some(Ok(message)) = socket.recv().await {
        match message {
            Message::Text(text) => {
                let _ = socket.send(Message::Text(text)).await;
            }
            Message::Binary(bytes) => {
                let _ = socket.send(Message::Binary(bytes)).await;
            }
            Message::Close(_) => break,
            _ => {}
        }
    }
}

async fn upload_placeholder() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "ok": true,
        "maxSize": 10_u64 * 1024 * 1024 * 1024,
        "note": "Replace with streaming SFTP upload implementation."
    }))
}

async fn download_placeholder() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "ok": true,
        "note": "Replace with streaming SFTP download implementation."
    }))
}
