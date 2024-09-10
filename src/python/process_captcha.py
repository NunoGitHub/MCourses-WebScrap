import cv2
import numpy as np
import json
import sys

def process_captcha(image_path, output_file):
    try:
        # Carregar a imagem
        image = cv2.imread(image_path)
        print(image_path)
        if image is None:
            print("error no image found")
            raise ValueError(f"not possible to load image in path {image.path}")
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        # Identificar as áreas clicáveis (Exemplo simplificado)
        # Suponha que as áreas clicáveis são detectadas por um metodo simples como a detecção de bordas
        edges = cv2.Canny(gray_image, 100, 200)
        # Encontrar contornos que representariam as áreas clicáveis
        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        clickable_areas = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            clickable_areas.append({'x': x, 'y': y, 'width': w, 'height': h})

        # Salvar as coordenadas no arquivo JSON
        try:
            with open(output_file, 'w') as f:
                json.dump(clickable_areas, f)
            print("Dados gravados com sucesso em", output_file)
        except IOError as e:
            print(f"Erro ao abrir ou escrever no arquivo: {e}")
        except json.JSONDecodeError as e:
            print(f"Erro ao codificar os dados em JSON: {e}")
        except Exception as e:
            print(f"Erro inesperado: {e}")

    except Exception as e:
        print(f"Error processing captcha: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) == 3:
        process_captcha(sys.argv[1], sys.argv[2])
        sys.stdout.flush()
    else:
        print("invalid arguments")