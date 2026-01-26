use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(serde::Serialize)]
struct ImageValidationResult {
    valid: bool,
    hash: String,
    timestamp: Option<String>,
    gps: Option<String>,
    error: Option<String>,
}

#[tauri::command]
fn validate_image(path: String) -> ImageValidationResult {
    // 1. Hash the file
    let mut file = match File::open(&path) {
        Ok(f) => f,
        Err(e) => {
            return ImageValidationResult {
                valid: false,
                hash: "".to_string(),
                timestamp: None,
                gps: None,
                error: Some(format!("Failed to open file: {}", e)),
            }
        }
    };

    let mut hasher = Sha256::new();
    let mut buffer = [0; 1024];
    loop {
        let count = match file.read(&mut buffer) {
            Ok(c) => c,
            Err(e) => {
                return ImageValidationResult {
                    valid: false,
                    hash: "".to_string(),
                    timestamp: None,
                    gps: None,
                    error: Some(format!("Failed to read file: {}", e)),
                }
            }
        };
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }
    let hash = hex::encode(hasher.finalize());

    // 2. Extract EXIF (Disabled for stability)
    /*
    let file_for_exif = match File::open(&path) {
        Ok(f) => f,
        Err(_) => {
             // ...
        }
    };
    // ...
    */

    let timestamp = None;
    let gps = None;

    ImageValidationResult {
        valid: true,
        hash,
        timestamp,
        gps,
        error: None,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, validate_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
