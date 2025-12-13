package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"pc-configurator/internal/models"
	"pc-configurator/internal/repository"
)

// Допоміжні структури для парсингу JSON
type CpuSpecs struct {
	Socket string `json:"socket"`
	TDP    int    `json:"tdp"`
}

type MotherboardSpecs struct {
	Socket     string `json:"socket"`
	MemoryType string `json:"memory_type"`
}

type RamSpecs struct {
	Type string `json:"type"`
}

type PsuSpecs struct {
	Wattage int `json:"wattage"`
}

type GpuSpecs struct {
	TDP int `json:"tdp"`
}

type CompatibilityService struct {
	repo repository.ComponentRepository
}

func NewCompatibilityService(repo repository.ComponentRepository) *CompatibilityService {
	return &CompatibilityService{repo: repo}
}

type ValidationResult struct {
	IsValid  bool     `json:"is_valid"`
	Messages []string `json:"messages"`
}

func (s *CompatibilityService) ValidateBuild(ctx context.Context, componentIDs []int) (ValidationResult, error) {
	result := ValidationResult{IsValid: true, Messages: []string{}}

	// Отримання компонентів
	var components []models.Component
	for _, id := range componentIDs {
		comp, err := s.repo.GetByID(ctx, id)
		if err != nil {
			return result, err
		}
		components = append(components, *comp)
	}

	// Сортування компонентів по типах
	var cpu *models.Component
	var mobo *models.Component
	var rams []*models.Component
	var psu *models.Component

	totalTDP := 50 // Базове споживання

	for i := range components {
		c := &components[i]
		switch c.Category {
		case "cpu":
			cpu = c
			var specs CpuSpecs
			_ = json.Unmarshal(c.Specs, &specs)
			totalTDP += specs.TDP
		case "motherboard":
			mobo = c
		case "ram":
			rams = append(rams, c)
		case "gpu":
			var specs GpuSpecs
			_ = json.Unmarshal(c.Specs, &specs)
			totalTDP += specs.TDP
		case "psu":
			psu = c
		}
	}

	// Перевірка 1: CPU + Motherboard (Socket)
	if cpu != nil && mobo != nil {
		var cpuSpec CpuSpecs
		var moboSpec MotherboardSpecs
		_ = json.Unmarshal(cpu.Specs, &cpuSpec)
		_ = json.Unmarshal(mobo.Specs, &moboSpec)

		if !strings.EqualFold(cpuSpec.Socket, moboSpec.Socket) {
			result.IsValid = false
			result.Messages = append(result.Messages,
				fmt.Sprintf("Несумісність: Процесор %s (Socket %s) не підходить до плати %s (Socket %s)",
					cpu.Name, cpuSpec.Socket, mobo.Name, moboSpec.Socket))
		}
	}

	// Перевірка 2: RAM + Motherboard
	if mobo != nil && len(rams) > 0 {
		var moboSpec MotherboardSpecs
		_ = json.Unmarshal(mobo.Specs, &moboSpec)
		for _, ram := range rams {
			var ramSpec RamSpecs
			_ = json.Unmarshal(ram.Specs, &ramSpec)
			if !strings.EqualFold(moboSpec.MemoryType, ramSpec.Type) {
				result.IsValid = false
				result.Messages = append(result.Messages,
					fmt.Sprintf("Несумісність: Плата підтримує %s, а RAM - %s", moboSpec.MemoryType, ramSpec.Type))
			}
		}
	}

	// Перевірка 3: PSU (Блок живлення)
	if psu != nil {
		var psuSpec PsuSpecs
		_ = json.Unmarshal(psu.Specs, &psuSpec)
		recommended := float64(totalTDP) * 1.2
		if float64(psuSpec.Wattage) < recommended {
			result.IsValid = false
			result.Messages = append(result.Messages,
				fmt.Sprintf("Слабкий БЖ: Треба %.0f Вт, є %d Вт", recommended, psuSpec.Wattage))
		}
	}

	if result.IsValid && len(result.Messages) == 0 {
		result.Messages = append(result.Messages, "Збірка сумісна!")
	}

	return result, nil
}
