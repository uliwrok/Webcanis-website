# Laptop genérica para hero

`generic-laptop.glb` es el archivo final para integrar. `generic-laptop.blend` contiene el modelo editable y el estudio de iluminación. La escena original de Blender se conserva aparte. No se modificó la página web.

## Especificaciones

- 19,754 triángulos, 3 mallas y 5 nodos; 11 primitivas de material.
- 668,668 bytes (653 KiB), incluidas las dos texturas PNG.
- Aluminio con materiales PBR, teclado genérico, sin logotipos ni teclas propias de Mac.
- Dimensiones reales: 35 × 23.5 cm. glTF usa metros y eje Y vertical.
- No necesita decodificadores Draco/Meshopt ni extensiones obligatorias.
- El estudio, las luces y la cámara no se exportan al GLB. Iluminar el modelo en la web con un environment map o luces para apreciar el metal.

## Tapa y animación

`Laptop_Root` contiene `Laptop_Base` y `Lid_Hinge`. `Lid_Shell` y `Screen_Surface` son hijos de `Lid_Hinge`.

El pivote `Lid_Hinge` gira sobre su eje local X: **0 rad = cerrada**, **−1.832596 rad = abierta a 105°**, tanto en Blender como en el GLB exportado. La animación incluida `CloseLid` tiene duración de 1.5 s y recorre el cierre completo. Puede reproducirse en sentido inverso para abrir. No controlar a la vez el pivote manualmente y mediante AnimationMixer.

## Imagen de pantalla

`Screen_Surface` es un rectángulo 16:9 con UV completas 0–1. Su material es `Screen • replace image here`, con textura en base color y emisión. El nodo de imagen en Blender se llama `Screen_Image`. Sustituir ambas referencias para que el contenido sea el mismo en los dos canales.

En Three.js, cargar la imagen con `TextureLoader`, configurar `texture.flipY = false` y `texture.colorSpace = THREE.SRGBColorSpace`, asignarla a `screen.material.map` y `screen.material.emissiveMap`, y activar `screen.material.needsUpdate = true`. Se recomienda una imagen de 1024×576 o 1920×1080. El placeholder incluido es un degradado oscuro neutro.

## Comprobaciones

`python artifacts/laptop/validate_glb.py` verifica estructura GLB, jerarquía, UVs, texturas embebidas, presupuesto de triángulos/peso y animación. Además se reimportó el GLB en Blender para revisar el render y el cierre. El cierre deja unos 1.35 mm entre el teclado y el elemento más bajo de la tapa, excluyendo las bisagras.

El rendimiento y la iluminación dentro de la página se comprobarán durante la integración. Este archivo usa geometría simplificada en puertos y rejillas para mantener su peso bajo.
