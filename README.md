# DigiCash Fintech Microservices Core

[![Java 17+](https://img.shields.io/badge/Java-17+-blue.svg)](https://www.oracle.com/java/)
[![Spring Boot 3.x](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Executive Summary
**DigiCash Fintech Core** is a production-grade microservices architecture designed to handle high-frequency financial transactions. This project demonstrates expertise in building robust, scalable, and secure payment processing systems, with a core focus on **data integrity, concurrency control, and system resilience.**

The system is engineered to solve complex distributed systems challenges, ensuring that every transaction is atomic, consistent, and highly available in a high-concurrency environment.

## Architectural Pillars
* **ACID Compliance:** Implements rigorous transaction management within the `WalletService` using `Pessimistic Locking` to prevent double-spending and ensure ledger accuracy during high-concurrency spikes.
* **Event-Driven Architecture:** Utilizes **Apache Kafka** as a message broker to decouple core transaction processing from downstream services (SMS, Notifications, Callbacks), ensuring non-blocking execution.
* **Security-First Design:** Implements multi-layered security protocols including JWT-based authentication, `Bucket4j` for robust Rate Limiting, and `AES-256-GCM` for sensitive data encryption.
* **Fault Tolerance:** Features an automated transactional rollback mechanism that triggers upon database or service failure, maintaining system-wide consistency.

## Technical Stack
* **Backend:** Java 17, Spring Boot 3.3, Spring Security, Spring Data JPA.
* **Messaging:** Apache Kafka (Event Sourcing).
* **Database:** PostgreSQL (Serializable Isolation Level).
* **Caching/Limiting:** Redis (for Rate Limiting).
* **Testing:** JUnit 5, Mockito, Testcontainers.
* **Observability:** Prometheus, Grafana, ELK Stack for distributed tracing.

## Core Modules
| Module | Responsibility |
| :--- | :--- |
| **Gateway Service** | API Authentication, Rate Limiting, and Request Validation. |
| **Wallet Service** | Ledger management, balance locking, and transaction processing. |
| **Worker Service** | Asynchronous task execution and external webhook dispatching. |

## Live Demo & Simulation
Experience the live transaction flow, system topology, and fault-injection scenarios here:
👉 **[Access the Interactive Sandbox Here]**

## Setup & Execution
Ensure [Docker Desktop](https://www.docker.com/) is installed and running on your machine.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/digicash-fintech-sandbox.git](https://github.com/your-username/digicash-fintech-sandbox.git)
   cd digicash-fintech-sandbox
