const mysql = require('mysql2/promise');

// --- Données à migrer ---
const carsData = [
    {
      name: "JETOUR 1",
      category: "SUV / Crossovers",
      price: "120 000 FCFA/jour",
      image: "assets/voiture1.jpg",
      quantity: 5,
      features: [
        "Design moderne et valorisant",
        "Hybride rechargeable : économies & écologie",
        "Écran tactile central, connectivité avancée",
        "Conduite confortable et silencieuse"
      ],
      details: [
        "assets/voiture_interieure1_1.jpg",
        "assets/voiture_interieure1_2.jpg",
        "assets/voiture_interieure1_3.jpg"
      ]
    },
    {
      name: "JETOUR DASHING",
      category: "SUV / Crossovers",
      price: "85 000 FCFA/jour", 
      image: "assets/Voiture2.jpg",
      quantity: 7,
      features: [
        "7 vraies places familiales",
        "Toit panoramique pour une expérience haut de gamme",
        "Système audio premium",
        "Sécurité avancée (assistances, caméra 360°)"
      ],
      details: [
        "assets/voiture_interieure2_1.jpg",
        "assets/voiture_interieure2_2.jpg"
      ]
    },
    {
      name: "JMC GRAND AVENUE",
      category: "Pick-up / Utilitaire",
      price: "90 000 FCFA/jour",
      image: "assets/voiture3.jpg",
      quantity: 4,
      features: [
        "Pick-up double cabine spacieux",
        "Polyvalent pour travail & famille",
        "Grande capacité de chargement/remorquage",
        "Confort moderne (écran tactile, sécurité, climatisation)"
      ],
      details: [
        "assets/voiture_interieure3_1.jpg"
      ]
    },
    {
      name: "JETOUR X670",
      category: "SUV / Crossovers",
      price: "85 000 FCFA/jour",
      image: "assets/voiture4.jpg",
      quantity: 6,
      features: [
        "SUV haut de gamme, luxe et modernité",
        "Intérieur premium spacieux",
        "Technologies embarquées avancées",
        "Parfait pour déplacements d'affaires/événementiels"
      ],
      details: [
        "assets/voiture_interieure4_1.jpg"
      ]
    },
    {
      name: "JETOUR X50",
      category: "SUV / Crossovers",
      price: "130 000 FCFA/jour",
      image: "assets/Voiture5.jpg",
      quantity: 3,
      features: [
        "SUV urbain compact & économique",
        "Conduite facile, idéale ville & loisirs",
        "Connectivité smartphone",
        "Excellente consommation, budget maîtrisé"
      ],
      details: [
        "assets/voiture_interieure5_1.jpg",
        "assets/voiture_interieure5_2.jpg"
      ]
    },
    {
      name: "JETOUR T2",
      category: "SUV / Crossovers",
      price: "120 000 FCFA/jour",
      image: "assets/media_12.jpg",
      quantity: 5,
      features: [
        "Design moderne et robuste, look SUV d’aventure",
        "Intérieur spacieux et modulable, sièges ventilés, toit panoramique",
        "Technologie embarquée haut de gamme : écran tactile XXL, audio Sony 12 HP, caméra 360°",
        "Vraies capacités tout-terrain : 4 roues motrices, 7 modes de conduite, coffre massif"
      ],
      details: [
        "assets/voiture6_1.jpg",
        "assets/voiture6_2.jpg",
        "assets/voiture6_3.jpg"
      ]
    }
];

// --- Configuration de la base de données ---\nconst connectionString = process.env.DATABASE_URL || \'mysql://root:@localhost:3306/douala_rent\';\nconst isProduction = !!process.env.DATABASE_URL;\n\n// --- Logique du script ---\nasync function setupDatabase() {\n    let connection;\n    try {\n        // Pour la création initiale de la DB, on a besoin de se connecter sans spécifier de DB\n        const initialConnectionString = process.env.DATABASE_URL ? connectionString.substring(0, connectionString.lastIndexOf(\'/\')) : \'mysql://root:@localhost:3306\';\n        const dbName = connectionString.substring(connectionString.lastIndexOf(\'/\') + 1).split(\'?\')[0];\n\n        connection = await mysql.createConnection({\n            uri: initialConnectionString,\n            ssl: isProduction ? { rejectUnauthorized: false } : false\n        });\n\n        // 1. Créer la base de données si elle n\'existe pas\n        await connection.query(`CREATE DATABASE IF NOT EXISTS \\\`${dbName}\\\``);\n        console.log(`Database \'${dbName}\' created or already exists.`);\n\n        // Utiliser la nouvelle base de données\n        await connection.changeUser({ database: dbName });\n        console.log(`Switched to database \'${dbName}\'.`);

        // 2. Créer la table 'cars'
        await connection.query(`DROP TABLE IF EXISTS cars;`);
        await connection.query(`
            CREATE TABLE cars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                price VARCHAR(255),
                image VARCHAR(255),
                features JSON,
                details JSON,
                quantity INT DEFAULT 1,
                tags JSON
            );
        `);
        console.log("Table 'cars' created or recreated with quantity and tags column.");

        // 3. Créer la table 'bookings'
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                car_id INT NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(255),
                customer_email VARCHAR(255),
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
            );
        `);
        console.log("Table 'bookings' created or already exists.");

        // 5. Créer la table 'comments'
        await connection.query(`DROP TABLE IF EXISTS comments;`);
        await connection.query(`
            CREATE TABLE comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                car_id INT NOT NULL,
                author VARCHAR(255) NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
            );
        `);
        console.log("Table 'comments' created.");

        // 6. Insérer les données dans la table 'cars'
        console.log("Inserting car data...");
        for (const car of carsData) {
            // Assign some example tags based on car name/category
            let tags = [];
            if (car.category.includes("SUV")) tags.push("SUV");
            if (car.name.includes("JETOUR")) tags.push("High-Tech");
            if (car.name.includes("DASHING") || car.name.includes("X90") || car.name.includes("T2")) tags.push("Famille", "Confort");
            if (car.name.includes("GRAND AVENUE")) tags.push("Utilitaire", "Robuste");
            if (car.name.includes("X50")) tags.push("Économique", "Urbain");
            if (car.name.includes("X670")) tags.push("Luxe", "Affaires");
            if (car.name.includes("T1")) tags.push("Luxe", "High-Tech");


            const query = 'INSERT INTO cars (name, category, price, image, features, details, quantity, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const values = [
                car.name,
                car.category,
                car.price,
                car.image,
                JSON.stringify(car.features),
                JSON.stringify(car.details),
                car.quantity, // Use dynamic quantity
                JSON.stringify(tags)
            ];
            await connection.query(query, values);
        }
        console.log(`${carsData.length} cars inserted successfully.`);

        // 7. Insérer les données de commentaires
        console.log("Inserting comment data...");
        const [cars] = await connection.query('SELECT id, name FROM cars');
        const carIdMap = new Map(cars.map(car => [car.name, car.id]));

        const commentsData = [
            { car_name: 'JETOUR T2', author: 'Julien M.', rating: 5, text: 'Véhicule incroyable, très puissant et confortable. Parfait pour les longs trajets en famille.' },
            { car_name: 'JETOUR T2', author: 'Sarah L.', rating: 4, text: 'Look d\'aventurier qui fait tourner les têtes. L\'écran est immense, peut-être un peu trop !' },
            { car_name: 'JMC GRAND AVENUE', author: 'Patrice K.', rating: 5, text: 'Robuste et fiable. Je l\'ai utilisé pour un déménagement, sa capacité de chargement est impressionnante.' },
            { car_name: 'JETOUR DASHING', author: 'Carine T.', rating: 4, text: 'Très spacieux et le toit panoramique est un vrai plus pour les enfants.' },
            { car_name: 'JETOUR X50', author: 'Alain P.', rating: 5, text: 'Idéal pour la ville, facile à garer et consomme très peu. Service de location au top.' },
        ];

        for (const comment of commentsData) {
            const carId = carIdMap.get(comment.car_name);
            if (carId) {
                await connection.query(
                    'INSERT INTO comments (car_id, author, rating, comment_text) VALUES (?, ?, ?, ?)',
                    [carId, comment.author, comment.rating, comment.text]
                );
            }
        }
        console.log(`${commentsData.length} comments inserted successfully.`);

        console.log('\nDatabase setup complete! ✨');

    } catch (error) {
        console.error('An error occurred during database setup:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

setupDatabase();
