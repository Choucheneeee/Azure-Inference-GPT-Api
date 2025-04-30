import express from 'express';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Validate environment variables
const requiredEnvVars = ['TOKEN', 'ENDPOINT', 'MODEL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.log(process.env);
  console.log(missingEnvVars);
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const token = process.env.TOKEN;
const endpoint = process.env.ENDPOINT;
const model = process.env.MODEL;

// Initialize the client
const client = ModelClient(
  endpoint,
  new AzureKeyCredential(token),
);

// Route for chat completions
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: messages,
        temperature: 1,
        top_p: 1,
        model: model
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    res.json({ 
      response: response.body.choices[0].message.content 
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred while processing your request" });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

