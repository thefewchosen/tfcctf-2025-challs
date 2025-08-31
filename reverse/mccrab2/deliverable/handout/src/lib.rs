use wasm_bindgen::prelude::*;

static BRUH: &str = "REDACTED";

#[wasm_bindgen]
pub fn check_flag(flag: String) -> String {
    let mut obf_key = String::new();
    unimplemented!("REDACTED");
    let enc = encrypt(flag.clone(), obf_key.clone());
    println!("enc: {}", enc);
    if enc == BRUH {
        return "Correct!".to_string();
    } else {
        return "Wrong...".to_string();
    }
}

#[wasm_bindgen]
pub fn encrypt(input: String, key: String) -> String {
    let mut result = String::new();
    unimplemented!("REDACTED");
    hex_encode(result)
}

#[wasm_bindgen]
pub fn hex_encode(input: String) -> String {
    input
        .chars()
        .map(|c| format!("{:02x}", c as u8))
        .collect::<String>()
        .to_uppercase()
}

#[wasm_bindgen]
pub fn hex_decode(input: String) -> String {
    let mut result = String::new();
    for i in (0..input.len()).step_by(2) {
        let byte_str = &input[i..i + 2];
        let byte = u8::from_str_radix(byte_str, 16).unwrap();
        result.push(byte as char);
    }
    result
}

mod tests {
    use super::*;

    #[test]
    fn test_check_flag() {
        let input = "REDACTED";
        assert_eq!(check_flag(input.to_string()), "Correct!");
    }
}
