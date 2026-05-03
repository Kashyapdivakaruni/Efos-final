import os
import zipfile

def create_zip():
    exclude_dirs = {'node_modules', 'venv', '.venv', '__pycache__', '.git', '.vscode'}
    zip_filename = 'predihealth_final.zip'
    
    print(f"Creating {zip_filename}...")
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file == zip_filename or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, '.')
                zipf.write(file_path, arcname)
    
    print(f"✅ Successfully created {zip_filename}")

if __name__ == "__main__":
    create_zip()
