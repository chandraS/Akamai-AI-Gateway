import {
    environment,
    ZuploContext,
    ZuploRequest,
  } from "@zuplo/runtime";
  
  export default async function handler(
    request: ZuploRequest,
    context: ZuploContext
  ) {
    const apiKey = environment.AKAMAI_API_KEY;
  
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "AKAMAI_API_KEY is not configured",
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }
  
    const upstreamUrl =
      "https://api.akamai-inference.com/v1/chat/completions";
  
    const payload = {
      model: "qwen3-8b",
      messages: [
        {
          role: "user",
          content: "Who released the Qwen model?",
        },
      ],
    };
  
    const startedAt = Date.now();
  
    try {
      context.log.info({
        message: "Calling Akamai Serverless Inference",
        model: payload.model,
        upstreamUrl,
      });
  
      const response = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const durationMs = Date.now() - startedAt;
      const responseBody = await response.text();
  
      context.log.info({
        message: "Akamai inference response received",
        status: response.status,
        durationMs,
      });
  
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "content-type":
            response.headers.get("content-type") ??
            "application/json",
          "x-test-upstream-status": String(response.status),
          "x-test-upstream-duration-ms": String(durationMs),
        },
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
  
      const message =
        error instanceof Error
          ? error.message
          : String(error);
  
      context.log.error({
        message: "Akamai inference fetch failed",
        error: message,
        durationMs,
      });
  
      return new Response(
        JSON.stringify({
          error: "Akamai inference fetch failed",
          message,
          durationMs,
        }),
        {
          status: 502,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }
  }