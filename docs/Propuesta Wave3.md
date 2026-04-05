

# ***Wave3***

Plataforma de streaming musical descentralizada que utiliza blockchain, tokens y machine learning para recomendación personalizada y distribución automática de regalías entre artistas e inversores.

| Alumno | Padrón | email |
| :---- | :---- | :---- |
| Bogovic Federico Ezequiel | 96722 | fbogovic@fi.uba.ar |
| Bravo Arroyo Víctor Manuel | 98882 | vbravo@fi.uba.ar |
| Vetrano Ignacio Ezequiel | 106129 | ivetrano@fi.uba.ar |
| Williner Mariano | 83469 | mwilliner@fi.uba.ar |

**Tutor:** Damian Martinelli

[**2\. Resumen	2**](#2.-resumen)

[**3\. Palabras clave	2**](#3.-palabras-clave)

[**4\. Abstract	2**](#4.-abstract)

[**5\. Keywords	2**](#5.-keywords)

[**6\. Introducción	2**](#6.-introducción)

[**7\. Estado del Arte	3**](#7.-estado-del-arte)

[**8\. Problema detectado y/o faltante	4**](#8.-problema-detectado-y/o-faltante)

[**9\. Solución propuesta	5**](#9.-solución-propuesta)

[Smart Contracts	5](#smart-contracts)

[Tokens	6](#tokens)

[Clientes	6](#clientes)

[Sistema de recomendación	6](#sistema-de-recomendación)

[Almacenamiento de contenido	7](#almacenamiento-de-contenido)

[Sistema de regalías y autenticación descentralizada	7](#sistema-de-regalías-y-autenticación-descentralizada)

[**10\. Evaluación preliminar de impacto social y ambiental	7**](#10.-evaluación-preliminar-de-impacto-social-y-ambiental)

[Impacto Económico	7](#impacto-económico)

[Impacto Social	7](#impacto-social)

[Impacto Ambiental	8](#impacto-ambiental)

[**11\. Metodología	8**](#11.-metodología)

[Proceso de desarrollo	8](#proceso-de-desarrollo)

[Riesgos	8](#riesgos)

[**12\. Experimentación y/o validación	9**](#12.-experimentación-y/o-validación)

[**13\. Plan de actividades	9**](#13.-plan-de-actividades)

[**14\. Referencias	9**](#14.-referencias)

## 

## 

## 

## 

## 

## 

## **2\. Resumen** {#2.-resumen}

Este trabajo propone el diseño e implementación de una plataforma de streaming de Wave3 descentralizada que busca redefinir la distribución y monetización del contenido digital. El sistema combina algoritmos de recomendación personalizados basados en aprendizaje automático con un modelo económico sustentado en tokens, los cuales se utilizan para reproducir canciones y se distribuyen automáticamente entre artistas, productores y disqueras mediante contratos inteligentes. Además, se explora el uso de almacenamiento descentralizado para resguardar los archivos de audio de forma segura y accesible. La propuesta apunta a garantizar transparencia, equidad y trazabilidad en la industria musical, integrando tecnología blockchain y aprendizaje automático para ofrecer una experiencia justa tanto para los creadores como para los oyentes.  
---

## **3\. Palabras clave** {#3.-palabras-clave}

Blockchain, NFT, streaming musical, tokens, economía digital, recomendación personalizada, smart contracts, machine learning  
---

## **4\. Abstract** {#4.-abstract}

This work presents the design and implementation of a decentralized music streaming platform that aims to redefine the distribution and monetization of digital content. The system combines personalized recommendation algorithms based on machine learning with a token-driven economy, where tokens are used to play songs and are automatically distributed among artists, producers, and record labels through smart contracts. Additionally, decentralized storage is used to securely and reliably host the audio files. The proposed solution seeks to ensure transparency, fairness, and traceability within the music industry by integrating blockchain technology and machine learning to create a balanced ecosystem for both creators and listeners.  
---

## **5\. Keywords** {#5.-keywords}

Blockchain, NFT, music streaming, token economy, smart contracts, personalized recommendation, digital economy, machine learning  
---

## **6\. Introducción** {#6.-introducción}

En un panorama donde la industria musical continúa centralizada en pocas plataformas y los artistas reciben una mínima parte de las ganancias, surge Wave3, una propuesta innovadora que combina streaming musical, blockchain e inteligencia artificial para transformar la forma en que se consume y se remunera la música.  
Wave3 ofrece una experiencia de escucha fluida y personalizada, al tiempo que garantiza transparencia y justicia en la distribución de regalías. Mediante contratos inteligentes, los pagos se reparten automáticamente entre artistas e inversores cada vez que una canción es reproducida. Además, las regalías de las canciones se representan mediante NFTs, permitiendo la propiedad fraccionada de las obras y habilitando a los fans o inversores a participar directamente en el éxito de una canción.  
Los usuarios adquieren tokens que utilizan para reproducir canciones, apoyar a sus artistas favoritos o acceder a beneficios exclusivos. Detrás del sistema, un modelo de recomendación basado en aprendizaje automático analiza gustos y patrones de escucha para ofrecer una experiencia única y adaptada a cada oyente.  
Desde el punto de vista técnico, Wave3 integra tecnologías de blockchain, almacenamiento descentralizado (IPFS) y machine learning, asegurando trazabilidad, seguridad y escalabilidad. Desde el punto de vista económico, plantea un modelo sostenible basado en la compra y quema de tokens, donde tanto artistas como oyentes se benefician dentro de un mismo ecosistema.  
Wave3 busca redefinir el futuro del streaming musical, ofreciendo una plataforma donde la música pertenece a quienes la crean, y el valor se distribuye de forma justa y transparente.  
Porque en Wave3, cada nota cuenta, y cada reproducción construye el futuro de la música.

---

## **7\. Estado del Arte** {#7.-estado-del-arte}

Las plataformas dominantes (Spotify, Apple Music, Youtube Music), operan con contratos confidenciales que dificultan el control para los artistas dando problemas tales como, tarifas difíciles de auditar, demoras en pagos, y fricción por metadatos y derechos fragmentados. A su vez, el uso de Machine Learning es maduro respecto a algoritmos de recomendación, pero el entrenamiento y orquestación es mayoritariamente centralizado.

En respuesta, el ecosistema web3 musical (Audius, Catalog, Royal) explora el uso de Blockchain, tokens (NFTs), y contratos inteligentes para generar una economía transparente de cara al creador de contenido. Sin embargo, la adopción de estas tecnologías es baja y dentro de los factores destaca el costo / latencia de transacciones, desconfianza en criptomonedas, y experiencia de usuario.  

El uso de Machine Learning en plataformas musicales suele estar relacionado con el aprendizaje de los gustos del usuario y la predicción de canciones afines. De este modo, incrementa su interacción con la plataforma, descubre nuevos géneros y obtiene sugerencias acordes a sus gustos. Los sistemas de recomendación más usados se basan en filtros colaborativos (usuario \- ítem), contenido (género, artista, y metadata) o híbridos. Respecto a la topología, en general los modelos predictores suelen entrenarse en servicios centralizados, pero con el auge de los dispositivos móviles e IoT han surgido estructuras no centralizadas como federadas (cada nodo disponibiliza deltas que se agrupan en un server), jerárquicas (basado en nodos padres e hijos) y descentralizadas (red peer-to-peer donde cada nodo comparte sus actualizaciones).  En la práctica, Spotify, Youtube y Apple Music utilizan modelos híbridos y centralizados sobre PyTorch / Tensorflow con pipelines en Kafka/Spark, mientras que catálogos indies como SoundCloud y Bandcamp prefieren  modelos ligeros y vector search. 

En paralelo, la investigación sobre NFTs fraccionados y economías tokenizadas en la música es reciente y ofrece nuevas oportunidades de financiamiento y participación de fans, permitiendo que los oyentes adquieran fracciones de derechos o ingresos futuros de una obra. Este enfoque busca democratizar la inversión en la industria musical, fomentar el compromiso de las comunidades y brindar a los artistas una vía directa de monetización sin intermediarios tradicionales.  
---

## **8\. Problema detectado y/o faltante** {#8.-problema-detectado-y/o-faltante}

La industria musical actual, especialmente en el ámbito digital, enfrenta una serie de desafíos estructurales que limitan tanto la eficiencia de la distribución de contenidos como la participación económica y la seguridad de los datos de los usuarios:

1. **Distribución de regalías poco transparente**:  
   Los modelos actuales concentran la mayor parte de los ingresos en pocas plataformas y sellos discográficos, dejando a los artistas con una proporción mínima de sus ganancias. Los procesos de cálculo y reparto de royalties son opacos y dependen de intermediarios, lo que genera retrasos y desconfianza.

2. **Escasa participación de fans en los ingresos de los artistas**:  
   En la mayoría de las plataformas de streaming, los oyentes no tienen mecanismos para apoyar directamente a los creadores ni para participar del éxito económico de una canción o álbum. Esto limita la interacción entre audiencia y artistas y restringe oportunidades de financiación colaborativa.

3. **Falta de mecanismos de economía interna que vinculen reproducción, inversión y consumo**:  
   No existen sistemas integrados que conecten de manera fluida la reproducción de música, la inversión en artistas y la circulación de valor dentro de la plataforma. Esto impide la creación de un ecosistema sostenible donde todas las partes —artistas, fans e inversores— se beneficien de manera simultánea.

4. **Entrenamiento centralizado de modelos de recomendación y riesgos asociados**:  
   Los sistemas tradicionales de machine learning que generan recomendaciones personalizadas suelen centralizar grandes volúmenes de datos de usuarios, generando costos elevados de infraestructura y aumentando los riesgos asociados a la privacidad y seguridad de la información personal. No existen soluciones robustas que permitan entrenar modelos de forma descentralizada, mitigando estos costos y riesgos.

Estos problemas evidencian la necesidad de una plataforma que integre transparencia en la distribución de ingresos, participación activa de los fans, economía interna sostenible y sistemas de recomendación seguros y descentralizados, garantizando un ecosistema más justo, eficiente y confiable para todos los actores de la industria musical.

---

## **9\. Solución propuesta** {#9.-solución-propuesta}

Nuestra solución consiste en una plataforma de streaming de música descentralizada en la blockchain que, mediante contratos inteligentes, permite el intercambio de tokens entre usuarios, artistas, productores e inversores. Además, cuenta con un sistema de recomendación musical que sugiere canciones según el gusto de los usuarios.  
A continuación describimos los componentes principales de nuestro sistema y las posibles tecnologías a utilizar:

### Smart Contracts {#smart-contracts}

Los contratos inteligentes gestionan las transacciones y reglas de negocio dentro de la plataforma. Entre sus funciones principales se incluyen:

* **Distribución automática de regalías**: Cada reproducción de una canción ejecuta un contrato que reparte tokens de forma proporcional entre artista e inversores según lo definido en el NFT del track.  
* **Propiedad fraccionada de obras**: Los NFTs de canciones pueden dividirse en participaciones que los usuarios pueden adquirir, permitiendo inversión directa en artistas.  
* **Registro de autoría**: Cada obra queda registrada en la blockchain, asegurando trazabilidad e integridad sobre su autoría y fecha de publicación.

Las tecnologías candidatas son Solidity / Vyper sobre Ethereum o Polygon, priorizando compatibilidad con ERC-20 (tokens), ERC-721/1155 (NFTs) y EIP-2981 para el royalty info.

### Tokens {#tokens}

El sistema utiliza tokens que representan valor dentro de la plataforma.

* **Compra de tokens**: Los usuarios adquieren tokens con moneda fiat o criptomonedas para acceder a las funcionalidades del sistema.  
* **Uso de tokens**: Sirven para reproducir canciones, adquirir fracciones de NFTs o aumentar la prioridad de sugerencia en el sistema de recomendación.  
* **Recompensas**: Los artistas, productores e inversores reciben tokens según la cantidad de reproducciones.

El token podría implementarse bajo el estándar ERC-20, con gobernanza parcial delegada mediante contratos DAO.

### Clientes {#clientes}

* **Usuario – Mercado musical**: interfaz gráfica para búsqueda, reproducción de canciones y compra de créditos (TFs) y compra de derechos de regalias (NFTs).

* **Artistas – Compartir contenido**: permite subir canciones, visualizar estadísticas y gestionar regalías o ventas de NFTs.

* **Administrador – Control de la plataforma**: interfaz de supervisión de actividad, gestión de contratos y monitoreo del sistema.


### Sistema de recomendación {#sistema-de-recomendación}

Descentralizado y del tipo híbrido entre colaborativo y de contenido. Las herramientas más comunes están basadas en PyTorch y TensorFlow, con arquitecturas distribuidas como Hivemind, Horovod y BlueFog para permitir entrenamiento cooperativo entre nodos.  
El modelo considera tanto el historial de reproducciones del usuario como las características musicales (género, tempo, artistas relacionados, etc.), y sugiere canciones de forma dinámica en base al perfil de escucha y a la interacción con la economía de tokens.

### Almacenamiento de contenido {#almacenamiento-de-contenido}

Usaremos un sistema de archivos descentralizado como InterPlanetary File System (IPFS) para el almacenamiento de la discografía y checkpoints del modelo de Machine Learning.  
Cada archivo de audio se sube en forma cifrada y su hash (CID) queda registrado en el NFT correspondiente, garantizando autenticidad e inmutabilidad del contenido.

### Sistema de regalías y autenticación descentralizada {#sistema-de-regalías-y-autenticación-descentralizada}

Los pagos y el acceso a contenido están gobernados por smart contracts, y la autenticación de usuarios y artistas se maneja mediante wallets, eliminando la necesidad de cuentas centralizadas. Esto garantiza seguridad y reduce costos operativos.  
---

## **10\. Evaluación preliminar de impacto social y ambiental** {#10.-evaluación-preliminar-de-impacto-social-y-ambiental}

### Impacto Económico {#impacto-económico}

* **Redistribución justa de ingresos**: Wave3 introduce un modelo de distribución automática y transparente de regalías mediante contratos inteligentes, asegurando que los artistas, y demás participantes reciban una compensación justa por cada reproducción. Esto contribuye a una economía más equitativa dentro de la industria musical, reduciendo la concentración de ingresos en pocas plataformas y grandes sellos discográficos.  
* **Estímulo a nuevas oportunidades de inversión**: El uso de tokens y NFTs como representación de la propiedad intelectual permite la creación de nuevos modelos de inversión. Los usuarios pueden participar en la economía de la música adquiriendo fracciones de canciones, impulsando la financiación directa de proyectos musicales y favoreciendo la economía colaborativa.

### Impacto Social {#impacto-social}

* **Empoderamiento de artistas independientes**: Wave3 brinda a los músicos la posibilidad de publicar y monetizar su contenido sin depender de grandes discográficas o intermediarios. Esto amplía las oportunidades de visibilidad para artistas emergentes, fomentando la diversidad cultural y reduciendo las barreras de entrada al mercado musical.  
* **Fomento de la transparencia y la confianza**: Gracias a la trazabilidad del blockchain, los usuarios pueden verificar el destino de los pagos y la autenticidad de las obras. Esta transparencia refuerza la confianza entre artistas, oyentes e inversores, promoviendo un entorno más ético y responsable en la industria del entretenimiento.  
* **Fomento de la comunidad y la participación**: Wave3 no solo es una plataforma de streaming, sino también un espacio participativo donde los oyentes pueden interactuar con los artistas, apoyar sus proyectos y acceder a contenido exclusivo. Esto fortalece el vínculo entre creadores y audiencia, generando una comunidad activa y colaborativa.

### Impacto Ambiental {#impacto-ambiental}

* **Reducción del uso de infraestructura física**: Al operar principalmente en entornos digitales y descentralizados, Wave3 contribuye a reducir la necesidad de servidores físicos propios y centros de datos tradicionales. Esto disminuye el consumo energético y los desechos electrónicos asociados al mantenimiento de infraestructuras centralizadas.

  ---

  ## **11\. Metodología** {#11.-metodología}

El proyecto se llevará a cabo utilizando metodologías ágiles dado que es lo que se utiliza comúnmente en el ámbito laboral actual.

### Proceso de desarrollo {#proceso-de-desarrollo}

Se plantea un desarrollo iterativo con sprints de 2 semanas que abren y cierran con una reunión quincenal con el tutor en la cual se mostrará el avance y se recibirá feedback.  
Se priorizarán las tareas necesarias para llegar a un MVP sobre el cual se agregará funcionalidad si lo permite la carga horaria del equipo.  
El seguimiento de tareas se hará en un tablero de estilo Kanban  mediante una herramienta de gestión como *Trello* o similar.

### Riesgos {#riesgos}

**Poca experiencia en el stack tecnológico:** La mayor parte del equipo de desarrollo no cuenta con experiencia en desarrollo sobre blockchain y/o LLMs.  
**Viabilidad del modelo económico:** Dado que se plantea un modelo económico novedoso, no se tiene certeza de que el mismo sea viable.  
**Alcance del proyecto:** Debido a los riesgos antes mencionados, existe la posibilidad de que el alcance propuesto sea demasiado optimista.  
**Implicancias legales:** El equipo de desarrollo no cuenta con experiencia legal suficiente como para verificar que la solución propuesta es viable desde el punto de vista legal o qué posibles resguardos sean necesarios implementar.  
**Manipulación del mercado:** Existe el riesgo de que se manipule la economía, por ejemplo, con la cantidad de veces que se escuche una canción o el valor del token. Se busca evitar el inflado artificial de plays y el bypass de regalías, garantizando medición verificable y liquidaciones auditables.  
**Experiencia de usuario:** Ejecutar un modelo de machine learning en el dispositivo del cliente podría afectar el rendimiento, provocando demoras o una experiencia de uso menos fluida.

---

## **12\. Experimentación y/o validación** {#12.-experimentación-y/o-validación}

* Simulación de compra/venta de cuotapartes de regalías.  
    
* Simulación de reproducciones y distribución de tokens.

* Evaluación de la recomendación personalizada con métricas de precisión y cobertura.

* Testeo de mercado interno de tokens/NFTs con usuarios piloto.  
    
* Pruebas de carga.  
  ---

  ## **13\. Plan de actividades** {#13.-plan-de-actividades}

A continuación detallamos un posible plan de actividades

**Mes 1-2:** Investigación y diseño de arquitectura.

**Mes 3-4:** Desarrollo de smart contracts y tokenomics. Desarrollo de UI.

**Mes 5-6:** Desarrollo del motor de recomendación ML. Desarrollo de UI.

**Mes 7-8:** Integración y pruebas internas. Desarrollo de UI.

**Mes 9:** Testeo con usuarios piloto y ajuste de economía de tokens.  Desarrollo de UI.

**Mes 10:** Documentación y presentación final.  
---

## **14\. Referencias** {#14.-referencias}

* Audius (2025). Audius whitepaper.  
* Catalini, C., & Gans, J. (2016). Some Simple Economics of the Blockchain. MIT Sloan Research Paper.  
* Spotify Technology S.A. (2024). Annual Report.  
* Wang, Q., et al. (2022). Fractional NFTs for Music: New Models for Rights and Royalties.  
* [Waqas Khan, Qazi & Khan, Anam & Rizwan, Atif & Ahmad, Rashid & Khan, Salabat & Kim, Do. (2023). Decentralized Machine Learning Training: A Survey on Synchronization, Consolidation, and Topologies. IEEE Access. PP. 1-1. 10.1109/ACCESS.2023.3284976.](https://www.researchgate.net/publication/371467061_Decentralized_machine_learning_training_a_survey_on_synchronization_consolidation_and_topologies)   
  ---

