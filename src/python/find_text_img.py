from PIL import Image, ImageDraw
import easyocr
import cv2
import  numpy as np
import sys
import re
findTextDict = dict()


def preprocess_image(image_path):
    # Carregar a imagem em tons de cinza
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    # Aplicar multiplicação de kernel (convolução) para aumentar a nitidez
    # Kernel de nitidez
    kernel = np.array([[0, -1, 0],
                       [-1, 5, -1],
                       [0, -1, 0]])

    # Aplicar filtro de convolução na imagem
    sharpened = cv2.filter2D(src=image, ddepth=-1, kernel=kernel)

    # Aplicar limiarização adaptativa para binarizar a imagem
    processed_image = cv2.adaptiveThreshold(
        sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 41, 5
    )

    # Converter de volta para formato Pillow
    return Image.fromarray(processed_image)

def find_text_coordinates_pillow(image_path, search_text):
    # Pré-processar a imagem
    preprocessed_image = preprocess_image(image_path)

    reader = easyocr.Reader(['en'])  # Carregar o modelo OCR para o idioma inglês
    results = reader.readtext(np.array(preprocessed_image), adjust_contrast=0.5)  # Ajustar contraste

    draw = ImageDraw.Draw(preprocessed_image)  # Para desenhar na imagem, se necessário

    # Loop para encontrar o texto exato
    for (bbox, text, prob) in results:
        # Separar o texto detectado em palavras
        words = text.split()

        if search_text.lower() in map(str.lower, words):  # Procurar por "Refresh"
            # Extrair as coordenadas da caixa delimitadora e converter para inteiros
            (top_left, top_right, bottom_right, bottom_left) = bbox
            top_left = (int(top_left[0]), int(top_left[1]))
            bottom_right = (int(bottom_right[0]), int(bottom_right[1]))

            # Calcular a nova caixa delimitadora para "Refresh"
            text_width = bottom_right[0] - top_left[0]
            word_width = text_width // len(words)  # Estimativa da largura de cada palavra
            word_index = words.index(search_text)  # Encontrar o índice da palavra "Refresh"

            # Coordenadas da nova caixa delimitadora apenas para "Refresh"
            refresh_left_x = top_left[0] + word_index * word_width
            refresh_right_x = refresh_left_x + word_width

            # Caixa delimitadora nova para desenhar
            refresh_top_left = (refresh_left_x, top_left[1])
            refresh_bottom_right = (refresh_right_x, bottom_right[1])

            # Coordenadas para o clique
            x = int((refresh_top_left[0] + refresh_bottom_right[0]) / 2)
            y = int((refresh_top_left[1] + refresh_bottom_right[1]) / 2)
            #print(f"Texto '{search_text}' encontrado nas coordenadas ({x}, {y})")

            # Desenhar a caixa na imagem ao redor de "Refresh"
            #draw.rectangle([refresh_top_left, refresh_bottom_right], outline="green", width=2)
            #preprocessed_image.show()  # Abre a imagem em uma visualização padrão
            findTextDict.update({search_text.lower(): (x,y)})
            return (x, y)

        if "verifying".lower() in map(str.lower, words):
            findTextDict.update({"verifying": "true"})
            #print(f"verifying")
            #return "verifying"

    #print(f"Text '{search_text}' not found.")
    return None

if __name__ == "__main__":
    #find_text_coordinates_pillow("teste.png","Refresh")
    #output = findTextDict.get("refresh")
    #if output:
    #    print(output)
    #    sys.stdout.flush()
    #    sys.exit(0)
    #output = findTextDict.get("verifying")
    #if output:
    #    print(output)
    #    sys.stdout.flush()
    #    sys.exit(0)
    #sys.exit(0)
    if len(sys.argv) == 3:
      find_text_coordinates_pillow(sys.argv[1], sys.argv[2])

      output = findTextDict.get(sys.argv[2].lower())
      if output:
            print(output)
            sys.stdout.flush()
            sys.exit(0)

      output = findTextDict.get("verifying")
      if output:
            print("verifying")
            sys.stdout.flush()
            sys.exit(0)
    else:
      print("invalid arguments")
      sys.stdout.flush()
      sys.exit(0)