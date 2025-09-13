const fs = require("fs");
const path = require("path");

function generateGoFileContentText(
  projectPath,
  outputFile = "go_file_content.txt"
) {
  const excludeDirs = ["vendor", ".git", "node_modules", ".next"];
  const outputStream = fs.createWriteStream(outputFile, { encoding: "utf8" });

  outputStream.write("--- Folder Structure ---\n");

  function walkDir(dir, relativePath = ".") {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    const displayPath = relativePath === "." ? "." : `${relativePath}/`;
    outputStream.write(displayPath + "\n");

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      const subPath = path.join(relativePath, file.name);

      if (file.isDirectory()) {
        if (excludeDirs.some((exclude) => fullPath.includes(exclude))) continue;
        walkDir(fullPath, subPath);
      } else if (
        file.isFile() &&
        [".js", ".jsx", ".css", ".html", ".local", ".ts", ".tsx"].some((ext) =>
          file.name.endsWith(ext)
        )
      ) {
        outputStream.write(`  ${file.name}\n`);
      }
    }
  }

  function writeGoFileContents(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        if (excludeDirs.some((exclude) => fullPath.includes(exclude))) continue;
        writeGoFileContents(fullPath);
      } else if (
        file.isFile() &&
        [".js", ".jsx", ".css", ".html", ".local", ".ts", ".tsx"].some((ext) =>
          file.name.endsWith(ext)
        )
      ) {
        outputStream.write(`--- ${file.name} ---\n`);
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          outputStream.write(content + "\n\n");
        } catch (err) {
          outputStream.write(`Error reading file: ${err.message}\n\n`);
        }
      }
    }
  }

  walkDir(projectPath);
  outputStream.write("\n");
  writeGoFileContents(projectPath);
  outputStream.end(() => {
    console.log(`Go file content generated in '${outputFile}'`);
  });
}

// Replace with your actual path if needed
const projectPath = "./";
generateGoFileContentText(projectPath);
