#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::fs::File;
use std::io::Write;
use std::collections::HashMap;

#[derive(Debug, thiserror::Error)]
enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error)
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
      S: serde::ser::Serializer,
    {
      serializer.serialize_str(self.to_string().as_ref())
    }
}

fn print_type_of<T>(_: &T) {
    println!("{}", std::any::type_name::<T>())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn play() -> String {
    "Hello".into()
}

#[tauri::command]
fn write_json(data: &[u8], name: &str) -> Result<String, Error> {
    let mut home: String = match home::home_dir() {
        Some(path) => path.into_os_string().into_string().unwrap(),
        None => "none".to_string(),
    };

    home.push_str("/outputs/txt2img-samples/",);
    
    let b = format!("{}", name);
    home.push_str(&b);
    home.push_str(".json");

    let mut file = File::create(home)?;
    file.write_all(data)?;
    
    let s = String::from("success");
    Ok(s)
}

#[tauri::command]
fn list_images() -> HashMap<std::string::String, &'static str> {
    let mut modules = HashMap::new();

    let mut home: String = match home::home_dir() {
        Some(path) => path.into_os_string().into_string().unwrap(),
        None => "none".to_string(),
    };
    home.push_str("/outputs/txt2img-samples/");
    let mut paths = fs::read_dir(home).unwrap();
    
    for entry in paths {
        let entry = entry.unwrap();
        let file_name = entry.path().file_name().unwrap().to_string_lossy().into_owned();
        modules.insert(file_name, "");
    };
    modules
}


#[tauri::command]
fn get_images() -> String {
    let mut home: String = match home::home_dir() {
        Some(path) => path.into_os_string().into_string().unwrap(),
        None => "none".to_string(),
    };
    home.push_str("/outputs/test.json");
    println!("In file {}", home);

    let contents = fs::read_to_string(home)
        .expect("Should have been able to read the file");

    println!("With text:\n{contents}");
    contents
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![play])
        .invoke_handler(tauri::generate_handler![get_images])
        .invoke_handler(tauri::generate_handler![write_json])
        .invoke_handler(tauri::generate_handler![list_images])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
