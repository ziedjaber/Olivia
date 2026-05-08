package com.olivia.backend.benchmark;

import com.olivia.backend.dto.ChatMessageDTO;
import com.olivia.backend.model.Collecte;
import com.olivia.backend.model.ResourceOrder;
import com.olivia.backend.service.CollecteService;
import com.olivia.backend.service.ResourceOrderService;
import com.olivia.backend.service.ChatService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.api.core.ApiFuture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

@SpringBootTest
@ActiveProfiles("test")
public class OliviaPerformanceTest {

    @Autowired
    private CollecteService collecteService;

    @Autowired
    private ResourceOrderService resourceOrderService;

    @Autowired
    private ChatService chatService;

    @MockBean
    private Firestore db;

    private static final int ITERATIONS = 100;

    @BeforeEach
    public void setup() throws Exception {
        CollectionReference colRef = mock(CollectionReference.class);
        DocumentReference docRef = mock(DocumentReference.class);
        ApiFuture apiFuture = mock(ApiFuture.class);

        // Chain mocking
        when(db.collection(anyString())).thenReturn(colRef);
        when(colRef.document(anyString())).thenReturn(docRef);
        when(colRef.document()).thenReturn(docRef);
        
        // Ensure set and update always return the future
        when(docRef.set(any())).thenReturn(apiFuture);
        when(docRef.set(any(), any())).thenReturn(apiFuture);
        when(docRef.update(any())).thenReturn(apiFuture);
        when(docRef.update(anyString(), any(), any(Object[].class))).thenReturn(apiFuture);
        
        // Mock the future results
        when(apiFuture.get()).thenReturn(mock(com.google.cloud.firestore.WriteResult.class));
        when(apiFuture.get(org.mockito.ArgumentMatchers.anyLong(), any(java.util.concurrent.TimeUnit.class))).thenReturn(mock(com.google.cloud.firestore.WriteResult.class));
    }

    private long anyLong() { return 30L; }

    @Test
    public void benchmarkPlanificationMission() throws Exception {
        System.out.println("\n[BENCHMARK] Planification de Mission (createCollecte)");
        long start = System.nanoTime();
        for (int i = 0; i < ITERATIONS; i++) {
            Collecte c = new Collecte();
            c.setDescription("Mission " + i);
            collecteService.createCollecte(c);
        }
        long end = System.nanoTime();
        printResult("Planification Mission", start, end);
    }

    @Test
    public void benchmarkAffectationRessources() throws Exception {
        System.out.println("\n[BENCHMARK] Affectation de Ressources (createOrder)");
        long start = System.nanoTime();
        for (int i = 0; i < ITERATIONS; i++) {
            ResourceOrder order = new ResourceOrder();
            order.setCollecteId("COL-" + i);
            resourceOrderService.createOrder(order);
        }
        long end = System.nanoTime();
        printResult("Affectation Ressources", start, end);
    }

    @Test
    public void benchmarkEnvoiMessages() throws Exception {
        System.out.println("\n[BENCHMARK] Envoi de Messages (chatService.save)");
        long start = System.nanoTime();
        for (int i = 0; i < ITERATIONS; i++) {
            ChatMessageDTO dto = new ChatMessageDTO();
            dto.setConversationId("C1");
            dto.setContent("Msg " + i);
            chatService.save(dto, "USER-1");
        }
        long end = System.nanoTime();
        printResult("Envoi Message Chat", start, end);
    }

    private void printResult(String name, long start, long end) {
        double avg = (double)(end - start) / ITERATIONS / 1_000_000.0;
        System.out.printf(">>> Result: %s : %.4f ms (avg)%n", name, avg);
    }
}
