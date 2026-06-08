# Sistema de votación

## Características

- Funciona sin conexión a Internet.
- Comunicación mediante UDP Broadcast.
- Resultados en tiempo real.
- Exportación a CSV.
- Soporte para múltiples visores.
- Código fuente abierto.

Este repositorio es el código fuente de un sistema para administrar votaciones en tiempo real dentro de una red LAN privada, sin necesidad de conexión a Internet.

El sistema se divide en dos aplicaciones: 

- **Voter:** se usa en una o más computadoras para registrar los votos de los participantes. De forma frecuente envía paquetes UDP a través de Broadcast al puerto elegido por el usuario (por defecto `8999`). Estos paquetes están cifrados para evitar ataques simples, sin embargo _como el código fuente es abierto_, no es una solución infalible ante ataques un poco más avanzados, por lo cual se recomienda compilar una versión con una llave secreta propia.

- **VotesViewer:** está pensado para correr en un único computador, pero, también puede ser usado por varios dispositivos a la vez. Esta aplicación se encarga de recibir todos y cada uno de los paquetes que envían los dispositivos que ejecutan **Voter** para organizarlos y mostrar un gráfico de los resultados de las votaciones en tiempo real. Está pensado para ser proyectado.

![System concept](.wacky/system_concept.jpg)

## Preparando el sistema

### Creación de los candidatos

El sistema necesita que todos los dispositivos participantes compartan un archivo que contiene los candidatos. Este archivo se genera en la aplicación **Voter** >> **Edit candidates** >> **Export**. Luego, ese mismo archivo puede ser importado.

### Para importar en **Voter**:

**Edit candidates** >> **Import**

### Para importar en **VotesViewer**:

Haga clic en el botón que dice **Import** en el menú superior _(Si no ve el menú superior, mueva el mouse cerca al borde superior de la pestaña para que aparezca)_.

### Entorno de conexión

Todos los dispositivos deben estar en la misma red LAN. También, _todos los dispositivos deben configurar las aplicaciones para que apunten al mismo puerto_.

Se recomienda utilizar una red LAN privada y restringida a los participantes de la votación para reducir el riesgo de interferencias o inyección de paquetes.

El sistema funciona a través de UDP Broadcast, por lo cual debe asegurarse que todos los dispositivos puedan enviar y recibir paquetes por este medio.

## Finalizar la votación

Para finalizar la votación, vaya al equipo en el que ejecuta la aplicación **VotesViewer**, diríjase al menú superior y presione en **Save**. Podrá guardar un archivo `.csv` que contiene los resultados de la votación.

Para terminar la votación dentro de los equipos que ejecutan **Voter**, debe presionar la combinación `Ctrl + F` para finalizar la votación. También puede guardar los resultados en un archivo `.csv` de ese dispositivo particular.