import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import java.io.FileInputStream;
import java.util.concurrent.TimeUnit;

public class TestFirestore {
    public static void main(String[] args) {
        try {
            System.out.println("Current Java Date: " + new java.util.Date());
            FileInputStream serviceAccount = new FileInputStream("src/main/resources/firebase-key.json");
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            Firestore db = FirestoreClient.getFirestore();
            System.out.println("Listing collectes from Firestore...");
            var collectes = db.collection("collectes").get().get(10, TimeUnit.SECONDS);
            for (QueryDocumentSnapshot doc : collectes.getDocuments()) {
                System.out.println("Collecte: " + doc.getId() + " | Description: " + doc.get("description") + " | Statut: " + doc.get("statut"));
            }
            System.out.println("Total collectes: " + collectes.size());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
