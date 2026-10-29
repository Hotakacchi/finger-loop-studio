#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use include_dir::{include_dir, Dir};
use std::io::Cursor;
use tauri::{webview::{PermissionKind, PermissionResponse}, WebviewUrl, WebviewWindowBuilder};
use tiny_http::{Header, Response, Server, StatusCode};
static WEB: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../web");
const ORIGIN: &str = "http://127.0.0.1:49185/";
fn serve() -> Result<(), String> {
    let server = Server::http("127.0.0.1:49185").map_err(|e| format!("ローカルポートを開けません: {e}"))?;
    std::thread::spawn(move || for request in server.incoming_requests() {
        let raw = request.url().split('?').next().unwrap_or("");
        let path = if raw == "/" { "index.html" } else { raw.trim_start_matches('/') };
        if request.method() != &tiny_http::Method::Get || path.contains("..") { let _ = request.respond(Response::empty(StatusCode(404))); continue; }
        if let Some(file) = WEB.get_file(path) {
            let mime = match path.rsplit('.').next().unwrap_or("") { "html" => "text/html; charset=utf-8", "js" | "mjs" => "text/javascript; charset=utf-8", "wasm" => "application/wasm", _ => "application/octet-stream" };
            let header = Header::from_bytes("Content-Type", mime).unwrap();
            let response = Response::new(StatusCode(200), vec![header], Cursor::new(file.contents()), Some(file.contents().len()), None);
            let _ = request.respond(response);
        } else { let _ = request.respond(Response::empty(StatusCode(404))); }
    });
    Ok(())
}
fn main() {
    serve().expect("ローカルサーバーを起動できません。ポート 49185 を確認してください。");
    tauri::Builder::default().setup(|app| {
        WebviewWindowBuilder::new(app, "main", WebviewUrl::External(ORIGIN.parse().unwrap()))
            .title("Finger Loop Studio").inner_size(1440.0, 960.0).min_inner_size(740.0, 620.0)
            .on_permission_request(|_, kind| match kind { PermissionKind::Camera => PermissionResponse::Allow, _ => PermissionResponse::Default })
            .on_navigation(|url| url.as_str().starts_with(ORIGIN)).build()?;
        Ok(())
    }).run(tauri::generate_context!()).expect("アプリを起動できませんでした");
}
