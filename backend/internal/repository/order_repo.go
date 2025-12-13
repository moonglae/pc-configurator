package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"pc-configurator/internal/models"
)

type OrderRepo struct {
	db *sql.DB
}

func NewOrderRepo(db *sql.DB) *OrderRepo {
	return &OrderRepo{db: db}
}

func (r *OrderRepo) CreateOrder(order models.OrderRequest) (int, error) {
	var id int

	// Перетворюємо масив ID ([1, 2]) у JSON рядок ("[1, 2]") для бази
	componentsJson, err := json.Marshal(order.ComponentIDs)
	if err != nil {
		return 0, err
	}

	query := `
		INSERT INTO orders (customer_name, phone, delivery_address, payment_method, total_price, component_ids)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	err = r.db.QueryRow(query,
		order.CustomerName,
		order.Phone,
		order.DeliveryAddress,
		order.PaymentMethod,
		order.TotalPrice,
		componentsJson,
	).Scan(&id)

	if err != nil {
		return 0, fmt.Errorf("помилка запису замовлення: %w", err)
	}

	return id, nil
}
