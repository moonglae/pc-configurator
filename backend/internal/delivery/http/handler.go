package http

import (
	"encoding/json"
	"net/http"
	"strconv"

	"pc-configurator/internal/models"
	"pc-configurator/internal/repository"
	"pc-configurator/internal/service"
)

type Handler struct {
	compRepo    repository.ComponentRepository
	compService *service.CompatibilityService
	authService *service.AuthService
	orderRepo   *repository.OrderRepo // <--- ДОДАЛИ ЦЕ ПОЛЕ
}

// Оновили конструктор (додали repoOrder)
func NewHandler(
	r repository.ComponentRepository,
	cs *service.CompatibilityService,
	as *service.AuthService,
	or *repository.OrderRepo, // <--- І ТУТ
) *Handler {
	return &Handler{
		compRepo:    r,
		compService: cs,
		authService: as,
		orderRepo:   or, // <--- І ТУТ
	}
}

// --- ORDER HANDLER (НОВЕ) ---
func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req models.OrderRequest

	// Розшифровуємо JSON від клієнта
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Некоректні дані")
		return
	}

	// Зберігаємо в базу
	orderId, err := h.orderRepo.CreateOrder(req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Відповідаємо "ОК"
	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message":  "Замовлення успішно створено",
		"order_id": orderId,
	})
}

// --- ІНШІ ХЕНДЛЕРИ (Ті самі, що й були) ---

func (h *Handler) GetAllComponents(w http.ResponseWriter, r *http.Request) {
	// Зчитуємо параметри
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")
	sort := r.URL.Query().Get("sort") // asc або desc

	minPriceStr := r.URL.Query().Get("min_price")
	maxPriceStr := r.URL.Query().Get("max_price")

	var minPrice, maxPrice float64

	if minPriceStr != "" {
		minPrice, _ = strconv.ParseFloat(minPriceStr, 64)
	}
	if maxPriceStr != "" {
		maxPrice, _ = strconv.ParseFloat(maxPriceStr, 64)
	}

	// Викликаємо оновлений репозиторій
	components, err := h.compRepo.GetAll(r.Context(), category, minPrice, maxPrice, search, sort)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, components)
}

type validateRequest struct {
	ComponentIDs []int `json:"component_ids"`
}

func (h *Handler) ValidateBuild(w http.ResponseWriter, r *http.Request) {
	var req validateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	res, err := h.compService.ValidateBuild(r.Context(), req.ComponentIDs)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, res)
}

func (h *Handler) SignUp(w http.ResponseWriter, r *http.Request) {
	var input models.User
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}
	id, err := h.authService.CreateUser(input)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondWithJSON(w, http.StatusCreated, map[string]int{"id": id})
}

type signInInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) SignIn(w http.ResponseWriter, r *http.Request) {
	var input signInInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}
	token, err := h.authService.GenerateToken(input.Email, input.Password)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Login failed")
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"token": token})
}

// Helpers
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}
