/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FileCode, Coffee, Star, Shield, HelpCircle, Terminal } from 'lucide-react';

export default function CodeViewer() {
  const [activeTab, setActiveTab] = useState<'acid' | 'security' | 'queue' | 'tests'>('acid');

  const codeBlocks = {
    acid: {
      fileName: 'WalletService.java',
      description: 'Java Spring Boot Core Ledger service explaining transactional consistency, Custom Exceptions rollback handling, and Pessimistic locking queries to prevent multi-threaded race conditions.',
      code: `package com.fintech.gateway.service;

import com.fintech.gateway.model.Wallet;
import com.fintech.gateway.repository.WalletRepository;
import com.fintech.gateway.exception.InsufficientFundsException;
import com.fintech.gateway.exception.FinanceValidationException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import java.math.BigDecimal;

@Service
public class WalletService {

    private final WalletRepository walletRepository;

    public WalletService(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    /**
     * ACID COMPLIANT - SERIALIZABLE TRANSACTION WALLET TO WALLET TRANSFER
     * Crucial Fintech Design: Pessimistic write locks acquired on database rows to prevent double-spending
     * multi-threaded concurrent execution spikes.
     */
    @Transactional(
        isolation = Isolation.SERIALIZABLE,
        rollbackFor = { InsufficientFundsException.class, FinanceValidationException.class, Exception.class }
    )
    public void executeTransfer(String senderPhone, String receiverPhone, BigDecimal amount) {
        
        // 1. Acquire Database Pessimistic Write Lock (SELECT FOR UPDATE)
        Wallet senderWallet = walletRepository.findByPhoneForUpdate(senderPhone)
            .orElseThrow(() -> new FinanceValidationException("Sender wallet record target not found"));
            
        Wallet receiverWallet = walletRepository.findByPhoneForUpdate(receiverPhone)
            .orElseThrow(() -> new FinanceValidationException("Receiver wallet record target not found"));

        // 2. Business Logic Validation
        if (senderWallet.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException(
                String.format("Deduction failed. Balance TZS %s insufficient for requested amount TZS %s", 
                    senderWallet.getBalance(), amount)
            );
        }

        // 3. Subtract Sender Wallet Balance
        senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
        walletRepository.save(senderWallet);

        // Simulated intermediate crash checkpoint helper for demonstrations or network exceptions
        if (Boolean.getBoolean("simulated.network.crash")) {
            throw new RuntimeException("PostgreSQL DB Connection timeout mid-transaction. Triggering ACID rollback!");
        }

        // 4. Add Receiver Wallet Balance
        receiverWallet.setBalance(receiverWallet.getBalance().add(amount));
        walletRepository.save(receiverWallet);
        
        // Transaction completes. Spring database engine triggers database COMMIT, freeing locks automatically.
    }
}`
    },
    security: {
      fileName: 'SecurityAndRateLimit.java',
      description: 'Spring Security Filter parsing standard authentication Bearer JWT tokens, validating claim dates, and rate-limiting incoming traffic using Bucket4j Token Bucket rate filter structures.',
      code: `package com.fintech.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;

@Component
public class JwtAndRateLimitFilter extends OncePerRequestFilter {

    private final String JWT_SECRET = "fintech_super_secret_session_token_key_for_jwt_2026";
    
    // Create rate limiter Bucket4j bucket - Capacity: 10, Refill: 1 per second
    private final Bucket rateBucket = Bucket.builder()
        .addLimit(Bandwidth.classic(10, Refill.intervally(1, Duration.ofSeconds(1))))
        .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws IOException, jakarta.servlet.ServletException {

        // 1. Enforce Preemptive Security Rate Limiting
        if (!rateBucket.tryConsume(1)) {
            response.setStatus(429); // HTTP Code Too Many Requests
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", "5");
            response.getWriter().write("{\\"error\\": \\"Preemptive Rate Limit Exceeded. Brute Force Protected.\\"}");
            return;
        }

        // 2. Parse Bearer Authorization Header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Parse and decrypt signed web credentials verify signature
                Claims claims = Jwts.parserBuilder()
                    .setSigningKey(JWT_SECRET.getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

                request.setAttribute("userClaims", claims);
                
            } catch (Exception ex) {
                response.setStatus(401); // Unauthorized token
                response.getWriter().write("{\\"error\\": \\"Token signatures compromised or session expired\\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}`
    },
    queue: {
      fileName: 'AsynchronousEventBus.java',
      description: 'Kafka producer and consumer microservice configuration showing decoupling transactions from notification delivery (SMS/Email simulation dispatching) to support thousands of concurrent transactions.',
      code: `package com.fintech.gateway.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class AsynchronousEventBus {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String PAYMENT_TOPIC = "transaction-events-v1";

    public AsynchronousEventBus(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Publish transaction succeeded event to Kafka partition
     */
    public void dispatchPaymentSuccessEvent(PaymentEventPayload payload) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(payload);
            
            // Decoupled asynchronous delivery to Queue broker
            kafkaTemplate.send(PAYMENT_TOPIC, payload.getTransactionId(), jsonMessage);
            
        } catch (Exception e) {
            System.err.println("Fatal Queue dispatch fault: " + e.getMessage());
        }
    }

    /**
     * Notification Service consuming asynchronously from message bus
     * This decouples core banking ledgers from slow external cellular telecommunication API calls
     */
    @KafkaListener(topics = PAYMENT_TOPIC, groupId = "notification-dispatch-workers")
    public void onTransactionReceived(String message) {
        try {
            PaymentEventPayload event = objectMapper.readValue(message, PaymentEventPayload.class);
            
            System.out.printf("Async consumed event: %s. Sending SMS notification%n", event.getTransactionId());
            
            // Simulating Dispatching Twilio SMS gateway or Email server asynchronously
            cellularSmsProviderGatewaySend(
                event.getReceiverPhone(),
                String.format("Payment received: TZS %s from %s", event.getAmount(), event.getSenderPhone())
            );
            
        } catch (IOException e) {
            System.err.println("Listener parse failure: " + e.getMessage());
        }
    }

    private void cellularSmsProviderGatewaySend(String phone, String text) {
        // Asynchronous Cellular Gateway integration
    }
}`
    },
    tests: {
      fileName: 'WalletServiceTest.java',
      description: 'Unit and Integration test suite utilizing JUnit 5, Assertions, and Mockito verification mocks to validate reliable database transaction rollback boundaries.',
      code: `package com.fintech.gateway;

import com.fintech.gateway.model.Wallet;
import com.fintech.gateway.repository.WalletRepository;
import com.fintech.gateway.service.WalletService;
import com.fintech.gateway.exception.InsufficientFundsException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @InjectMocks
    private WalletService walletService;

    private Wallet senderWallet;
    private Wallet receiverWallet;

    @BeforeEach
    void setUp() {
        senderWallet = new Wallet();
        senderWallet.setPhone("+255712345678");
        senderWallet.setBalance(new BigDecimal("10000.00"));

        receiverWallet = new Wallet();
        receiverWallet.setPhone("+255655112233");
        receiverWallet.setBalance(new BigDecimal("500.00"));
    }

    @Test
    void testExecuteTransfer_Success() {
        // Arrange Mock query states 
        when(walletRepository.findByPhoneForUpdate("+255712345678")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByPhoneForUpdate("+255655112233")).thenReturn(Optional.of(receiverWallet));

        // Act
        walletService.executeTransfer("+255712345678", "+255655112233", new BigDecimal("4000.00"));

        // Assert: Verify new balance outputs
        assertEquals(new BigDecimal("6000.00"), senderWallet.getBalance());
        assertEquals(new BigDecimal("4500.00"), receiverWallet.getBalance());
        
        // Assert: Verify saves occurred on repository DB tables
        verify(walletRepository, times(1)).save(senderWallet);
        verify(walletRepository, times(1)).save(receiverWallet);
    }

    @Test
    void testExecuteTransfer_FailureRollback_InsufficientBalance() {
        // Arrange
        when(walletRepository.findByPhoneForUpdate("+255712345678")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByPhoneForUpdate("+255655112233")).thenReturn(Optional.of(receiverWallet));

        // Act & Assert exceptions throw
        assertThrows(InsufficientFundsException.class, () -> {
            walletService.executeTransfer("+255712345678", "+255655112233", new BigDecimal("12000.00"));
        });

        // Assert: Database isolation intact, balance has not been modified
        assertEquals(new BigDecimal("10000.00"), senderWallet.getBalance());
        assertEquals(new BigDecimal("500.00"), receiverWallet.getBalance());
        
        // Assert: Ensure no updates were saved upon validation failure
        verify(walletRepository, never()).save(senderWallet);
        verify(walletRepository, never()).save(receiverWallet);
    }
}`
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <FileCode className="text-emerald-400 h-5 w-5" />
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Senior Java Fintech Backend Code Architect</h3>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-800 text-xs font-mono overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('acid')}
          className={`px-4 py-2.5 font-bold cursor-pointer transition ${
            activeTab === 'acid'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. ACID Transactions
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 font-bold cursor-pointer transition ${
            activeTab === 'security'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Rate Limit & JWT Security
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 font-bold cursor-pointer transition ${
            activeTab === 'queue'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Async Kafka Broker
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2.5 font-bold cursor-pointer transition ${
            activeTab === 'tests'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          4. JUnit & Mockito Testing
        </button>
      </div>

      {/* Code description */}
      <div className="py-4 font-sans">
        <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mb-1">
          <Coffee className="h-4 w-4" />
          <span>Spring Boot Class: {codeBlocks[activeTab].fileName}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-normal">
          {codeBlocks[activeTab].description}
        </p>
      </div>

      {/* Actual syntax representation code block */}
      <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs select-text">
        <div className="absolute top-2 right-2 flex items-center gap-1 font-sans text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
          <Terminal className="h-3 w-3 text-emerald-500" />
          <span>Java / JDK 17</span>
        </div>
        <pre className="p-4 overflow-x-auto max-h-[380px] leading-relaxed select-all">
          <code>{codeBlocks[activeTab].code}</code>
        </pre>
      </div>
    </div>
  );
}
