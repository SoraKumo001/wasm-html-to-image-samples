import { promises as fs } from "node:fs";
import { render, close, setLimit, waitReady } from "wasm-html-to-image/workers";

const formats = ["webp", "jpeg", "png", "avif"] as const;

setLimit(4); // set worker limit

const main = async () => {
  const title = "Multi thread";
  console.time(title);
  await fs.mkdir("./image_output", { recursive: true });
  const files = await fs.readdir("./images");
  const p = files.map(async (file) => {
    return fs.readFile(`./images/${file}`).then((image) => {
      console.log(
        `${file} ${Math.ceil(image.length / 1024).toLocaleString()}KB`,
      );
      const p = formats.map(async (format) => {
        await waitReady();
        const label = `[${file}] -> [${format}]`;
        console.time(label);
        const value = file.endsWith(".svg")
          ? image.toString("utf-8")
          : Buffer.from(image);
        try {
          const { data } = await render({
            value,
            quality: 100,
            format,
            width: 512,
          });
          if (data) {
            console.timeLog(
              label,
              `${Math.ceil(data.length / 1024).toLocaleString()}KB`,
            );
            const fileName = file.split(".")[0];
            await fs.writeFile(`image_output/${fileName}.${format}`, data);
          }
        } catch (err) {
          console.timeEnd(label);
          console.error(`Failed to convert ${file} to ${format}:`, err);
        }
      });
      return Promise.all(p);
    });
  });
  await Promise.all(p);
  close(); // close worker
  console.timeEnd(title);
};
main();
