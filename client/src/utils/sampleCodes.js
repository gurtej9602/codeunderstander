/**
 * Preloaded test samples for instant 1-click evaluation of CodeUnderstander.
 */

export const SAMPLE_CODES = {
  java: {
    fileName: 'Sample.java',
    extension: '.java',
    language: 'Java',
    description: 'Demonstrates NullPointerException risks, unclosed Stream leak, and broad exception swallowing.',
    code: `import java.io.FileInputStream;
import java.io.IOException;

public class Sample {
    private String userName;

    public Sample(String userName) {
        this.userName = userName;
    }

    public void processUserData(String input) {
        // Potential NullPointerException if input is null
        if (input.length() > 0) {
            System.out.println("Processing: " + input.toUpperCase());
        }

        // Potential NullPointerException if userName was null
        System.out.println("User is: " + userName.trim());
    }

    public void readFileUnsafely(String filePath) {
        FileInputStream fis = null;
        try {
            // Resource leak: should use try-with-resources
            fis = new FileInputStream(filePath);
            int data = fis.read();
            while (data != -1) {
                System.out.print((char) data);
                data = fis.read();
            }
        } catch (Exception e) {
            // Swallowing generic Exception without logging
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        Sample sample = new Sample(null);
        sample.processUserData(null);
    }
}`
  },

  python: {
    fileName: 'sample.py',
    extension: '.py',
    language: 'Python',
    description: 'Features mutable default arguments, unclosed file descriptors, insecure eval, and bare except.',
    code: `import os
import sys

# Mutable default argument anti-pattern
def add_user_record(username, user_tags=[]):
    user_tags.append(username)
    return user_tags

def read_config_file(filepath):
    # Resource leak - file opened without 'with' statement
    f = open(filepath, 'r')
    content = f.read()
    
    # Insecure eval vulnerability
    config_dict = eval(content)
    return config_dict

def calculate_average(numbers):
    try:
        total = 0
        # Non-pythonic index-based loop
        for i in range(len(numbers)):
            total += numbers[i]
        return total / len(numbers)
    except:
        # Bare except clause masks keyboard interrupt and system exit
        print("An error occurred")
        return 0
`
  },

  javascript: {
    fileName: 'sample.js',
    extension: '.js',
    language: 'JavaScript',
    description: 'Highlights loose equality bugs, unintended global scope leakage, and uncleaned event listeners.',
    code: `function authenticateUser(userId, token) {
  // Loose equality bug
  if (userId == 0) {
    console.log("Guest login triggered");
  }

  // Accidental global variable (missing const/let)
  activeSession = { id: userId, token: token };

  return activeSession;
}

async function fetchUserDashboard(apiUrl) {
  // Floating promise without error boundary
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  // Potential memory leak: event listener attached inside function without teardown
  window.addEventListener('resize', () => {
    console.log('Resize handled for:', data.name);
  });

  return data;
}
`
  },

  cpp: {
    fileName: 'sample.cpp',
    extension: '.cpp',
    language: 'C++',
    description: 'Shows memory leaks from manual new without delete, buffer overflow risks, and uninitialized data.',
    code: `#include <iostream>
#include <cstring>

void processBuffers() {
    // Memory leak: allocated on heap without matching delete or smart pointer
    int* numbers = new int[50];
    
    char dest[10];
    const char* src = "This string exceeds the destination buffer length";
    
    // Buffer overflow risk: strcpy does not check bounds
    strcpy(dest, src);
    
    int uninitializedValue;
    // Undefined behavior: reading uninitialized variable
    if (uninitializedValue > 100) {
        std::cout << "Value exceeds limit" << std::endl;
    }
}

int main() {
    processBuffers();
    return 0;
}
`
  },

  html: {
    fileName: 'sample.html',
    extension: '.html',
    language: 'HTML',
    description: 'Uncovers missing image alt attributes, non-semantic div buttons, missing viewport, and SEO flaws.',
    code: `<html>
<head>
  <title>My Web Page</title>
</head>
<body>
  <div class="header">
    <h1>Welcome to Our Store</h1>
  </div>

  <div class="content">
    <!-- Missing alt text for accessibility (A11y) -->
    <img src="product_photo.jpg">
    
    <!-- Non-semantic interactive element without role or tabindex -->
    <div class="buy-button" onclick="checkout()">
      Buy Now
    </div>

    <!-- target=_blank without rel=noopener noreferrer security risk -->
    <a href="https://external-partner.com" target="_blank">Partner Link</a>
  </div>
</body>
</html>
`
  }
};
