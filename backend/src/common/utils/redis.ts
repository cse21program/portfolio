import net from "node:net";

export function pingRedis(redisUrl: string, timeoutMs = 2000): Promise<void> {
  const parsed = new URL(redisUrl);
  const port = Number(parsed.port || 6379);
  const host = parsed.hostname;

  return new Promise((resolve, reject) => {
    const socket = net.connect(port, host);
    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      socket.write("PING\r\n");
    });

    socket.on("data", (data) => {
      socket.end();
      if (data.toString().includes("PONG")) {
        resolve();
        return;
      }
      reject(new Error("Redis ping failed"));
    });

    socket.on("error", reject);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Redis ping timed out"));
    });
  });
}
