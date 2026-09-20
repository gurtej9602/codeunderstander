import java.io.FileInputStream;
import java.io.IOException;

public class Sample {
    private String userName;

    public Sample(String userName) {
        this.userName = userName;
    }

    public void processUserData(String input) {
        // Issue 1: Potential NullPointerException if input is null
        if (input.length() > 0) {
            System.out.println("Processing: " + input.toUpperCase());
        }

        // Issue 2: Potential NullPointerException if userName wasn't set
        System.out.println("User is: " + userName.trim());
    }

    public void readFileUnsafely(String filePath) {
        FileInputStream fis = null;
        try {
            // Issue 3: Resource leak - should use try-with-resources
            fis = new FileInputStream(filePath);
            int data = fis.read();
            while (data != -1) {
                System.out.print((char) data);
                data = fis.read();
            }
        } catch (Exception e) {
            // Issue 4: Swallowing generic Exception and printStackTrace
            e.printStackTrace();
        }
        // Notice fis.close() is never called in finally, leaking the file descriptor!
    }

    public static void main(String[] args) {
        Sample sample = new Sample(null);
        sample.processUserData(null);
    }
}
