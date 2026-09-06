import { promises as fs } from "node:fs";
import { render } from "wasm-html-to-image/single";

const formats = ["webp", "jpeg", "png", "avif"] as const;

const main = async () => {
  const title = "Single thread";
  console.time(title);
  await fs.mkdir("./image_output", { recursive: true });
  const files = await fs.readdir("./images");
  for (const file of files) {
    await fs.readFile(`./images/${file}`).then(async (image) => {
      console.log(
        `${file} ${Math.ceil(image.length / 1024).toLocaleString()}KB`,
      );
      const value = file.endsWith(".svg") ? image.toString("utf-8") : image;
      for (const format of formats) {
        const label = `[${file}] -> [${format}]`;
        console.time(label);
        try {
          const { data } = await render({
            value,
            quality: 80,
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
      }
    });
  }
  console.timeEnd(title);
};
main();
