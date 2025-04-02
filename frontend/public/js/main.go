package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

const (
	port            = ":5000"
	csvFileVote     = "script/voter_data_1.csv"
	csvFilePassword = "script/voter_passwords_1.csv"
	fonnteApiKey    = "jeupL8VdRJGbL46EoZwL" // bisa dari os.Getenv("FONNTE_API_KEY")
)

var (
	isProcessing bool
	processLock  sync.Mutex
)

type User struct {
	Name           string `json:"Name"`
	WhatsAppNumber string `json:"WhatsApp Number"`
	Password       string `json:"Password,omitempty"`
}
type SendResult struct {
	Phone  string `json:"phone"`
	Name   string `json:"name"`   // ⬅️ Tambahin Name
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
}

func main() {
	rand.Seed(time.Now().UnixNano())

	http.HandleFunc("/generate-passwords", withCORS(withAPIKeyAuth(handleGeneratePasswords)))
	http.HandleFunc("/send-passwords", withCORS(withAPIKeyAuth(handleSendPasswords)))

	// Ini buat frontend ambil CSV-nya!
	http.HandleFunc("/passwords.csv", withCORS(withAPIKeyAuth(handleServePasswordsCSV)))

	fmt.Printf("Server berjalan di http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

// ✅ /passwords.csv Handler
func handleServePasswordsCSV(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Serve CSV file langsung
	http.ServeFile(w, r, csvFilePassword)
}


func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // ⭐️ sementara "*", di production dibatasi
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-KEY")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// MiddleWare Generate password for security
const serverApiKey = "RahasiaBanget123" // pindahin ke ENV di production!

func withAPIKeyAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientKey := r.Header.Get("X-API-KEY")
		if clientKey != serverApiKey {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}


// ✅ Generate Random Password
func generateRandomPassword() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	password := make([]byte, 12) // 12 karakter
	for i := range password {
		password[i] = charset[rand.Intn(len(charset))]
	}
	return string(password)
}

// ✅ Read CSV voter_data_1.csv
func readVoterCSV() ([]User, error) {
	file, err := os.Open(csvFileVote)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		return nil, err
	}

	var users []User
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		} else if err != nil {
			return nil, err
		}

		user := User{}
		for i, header := range headers {
			switch strings.TrimSpace(header) {
			case "Name":
				user.Name = record[i]
			case "WhatsApp Number":
				user.WhatsAppNumber = record[i]
			}
		}

		users = append(users, user)
	}

	return users, nil
}

// ✅ Tulis ke voter_passwords_1.csv
func writePasswordsCSV(users []User) error {
	file, err := os.Create(csvFilePassword)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	headers := []string{"Name", "WhatsApp Number", "Password"}
	if err := writer.Write(headers); err != nil {
		return err
	}

	for _, user := range users {
		record := []string{user.Name, user.WhatsAppNumber, user.Password}
		if err := writer.Write(record); err != nil {
			return err
		}
	}

	return nil
}

// ✅ /generate-passwords Handler
// ✅ /generate-passwords Handler (UPDATE)
func handleGeneratePasswords(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	users, err := readVoterCSV()
	if err != nil {
		http.Error(w, "Gagal membaca file voter_data", http.StatusInternalServerError)
		log.Println("Error baca CSV:", err)
		return
	}

	if len(users) == 0 {
		respondJSON(w, map[string]interface{}{
			"success": false,
			"message": "Tidak ada data dalam CSV!",
		})
		return
	}

	for i := range users {
		users[i].Password = generateRandomPassword()
	}

	if err := writePasswordsCSV(users); err != nil {
		http.Error(w, "Gagal menulis file password", http.StatusInternalServerError)
		log.Println("Error tulis CSV:", err)
		return
	}

	respondJSON(w, map[string]interface{}{
		"success": true,
		"message": "Password berhasil dibuat dan disimpan di CSV!",
	})
}


// ✅ Baca voter_passwords_1.csv
func readPasswordsCSV() ([]User, error) {
	file, err := os.Open(csvFilePassword)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		return nil, err
	}

	var users []User
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		} else if err != nil {
			return nil, err
		}

		user := User{}
		for i, header := range headers {
			switch strings.TrimSpace(header) {
			case "Name":
				user.Name = record[i]
			case "WhatsApp Number":
				user.WhatsAppNumber = record[i]
			case "Password":
				user.Password = record[i]
			}
		}

		users = append(users, user)
	}

	return users, nil
}

// ✅ /send-passwords Handler
func handleSendPasswords(w http.ResponseWriter, r *http.Request) {
	processLock.Lock()
	if isProcessing {
		processLock.Unlock()
		respondJSON(w, map[string]interface{}{
			"success": false,
			"message": "Pengiriman sedang berlangsung, mohon tunggu...",
		})
		return
	}
	isProcessing = true
	processLock.Unlock()

	defer func() {
		processLock.Lock()
		isProcessing = false
		processLock.Unlock()
	}()

	users, err := readPasswordsCSV()
	if err != nil {
		http.Error(w, "Gagal membaca file passwords", http.StatusInternalServerError)
		log.Println("Error baca password CSV:", err)
		return
	}

	if len(users) == 0 {
		respondJSON(w, map[string]interface{}{
			"success": false,
			"message": "Tidak ada data dalam CSV!",
		})
		return
	}

	var results []SendResult

	for _, user := range users {
		delay := time.Duration(rand.Intn(1000)+1000) * time.Millisecond
		time.Sleep(delay)

		message := fmt.Sprintf(`Halo *%s*, ini adalah password Voting Anda: *%s* 
Gunakan password ini untuk login dan berikan suara terbaikmu!
Terima kasih Mas/Mbak *%s*.`, user.Name, user.Password, user.Name)

		status, errMsg := sendMessage(user.WhatsAppNumber, message)

		result := SendResult{
			Phone:  user.WhatsAppNumber,
			Name:   user.Name,  // ⬅️ Tambahin ini!
			Status: status,
			Error:  errMsg,
		}


		results = append(results, result)
		log.Printf("%s: %s", user.WhatsAppNumber, status)
	}

	respondJSON(w, map[string]interface{}{
		"success": true,
		"message": "Pengiriman selesai",
		"results": results,
	})
}

// ✅ Kirim ke Fonnte
func sendMessage(phone string, message string) (string, string) {
	url := "https://api.fonnte.com/send"
	payload := map[string]string{
		"target":  phone,
		"message": message,
	}

	jsonPayload, _ := json.Marshal(payload)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		log.Println("Request error:", err)
		return "Gagal", err.Error()
	}

	req.Header.Set("Authorization", fonnteApiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("HTTP error:", err)
		return "Gagal", err.Error()
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// Tambahin debug log
	log.Printf("Response body: %s", string(body))

	if resp.StatusCode != http.StatusOK {
		log.Printf("HTTP %d: %s", resp.StatusCode, string(body))
		return "Gagal", fmt.Sprintf("HTTP %d", resp.StatusCode)
	}

	// Parse JSON buat lihat status Fonnte
	var fonnteResp map[string]interface{}
	if err := json.Unmarshal(body, &fonnteResp); err != nil {
		log.Println("Error parsing Fonnte JSON:", err)
		return "Gagal", "Gagal parsing response"
	}

	status := fmt.Sprintf("%v", fonnteResp["status"])
	if status != "true" {
		errorMsg := fmt.Sprintf("%v", fonnteResp["message"])
		return "Gagal", errorMsg
	}

	return "Berhasil", ""
}


// ✅ Respond JSON
func respondJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
