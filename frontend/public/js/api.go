package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

// Base URL backend server
const BASE_URL = "http://localhost:5000"

// Struct sesuai response backend
type GenerateResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

type SendResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message"`
	Results []interface{} `json:"results"`
}

// GeneratePasswords call ke /generate-passwords
func GeneratePasswords() (*GenerateResponse, error) {
	url := fmt.Sprintf("%s/generate-passwords", BASE_URL)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error request generate-passwords: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP error, status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error membaca response body: %v", err)
		return nil, err
	}

	var result GenerateResponse
	if err := json.Unmarshal(body, &result); err != nil {
		log.Printf("Error parsing JSON generate-passwords: %v", err)
		return nil, err
	}

	log.Printf("Hasil generate-passwords: %+v", result)

	if !result.Success {
		return &result, fmt.Errorf("Gagal generate password: %s", result.Message)
	}

	return &result, nil
}

// SendPasswords call ke /send-passwords
func SendPasswords() (*SendResponse, error) {
	url := fmt.Sprintf("%s/send-passwords", BASE_URL)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error request send-passwords: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP error, status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error membaca response body: %v", err)
		return nil, err
	}

	var result SendResponse
	if err := json.Unmarshal(body, &result); err != nil {
		log.Printf("Error parsing JSON send-passwords: %v", err)
		log.Printf("Raw response text: %s", string(body))
		return nil, fmt.Errorf("Response dari server bukan JSON yang valid")
	}

	log.Printf("Hasil send-passwords: %+v", result)

	if !result.Success {
		return &result, fmt.Errorf("Gagal mengirim password: %s", result.Message)
	}

	return &result, nil
}
