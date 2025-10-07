
const mysql = require('mysql2/promise');

// --- Configuration de la base de données (doit correspondre à db.js) ---
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'douala_rent'
};

// --- Données de test pour les clients ---
const sampleCustomers = [
    { name: "Alice Dubois", phone: "699112233", email: "alice.d@example.com" },
    { name: "Bernard Talla", phone: "677445566", email: "bernard.t@example.com" },
    { name: "Céline Ngassa", phone: "655778899", email: "celine.n@example.com" },
    { name: "David Kamga", phone: "698123456", email: "david.k@example.com" },
    { name: "Émilie Fotso", phone: "676543210", email: "emilie.f@example.com" },
    { name: "Fabrice Wouansi", phone: "654987654", email: "fabrice.w@example.com" }
];

// --- Fonction pour générer une date aléatoire dans le passé ---
function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// --- Logique principale du script ---
async function generateFixtures() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connecté à la base de données pour générer les fixtures.");

        // 1. Récupérer les IDs des voitures existantes
        const [cars] = await connection.execute('SELECT id FROM cars');
        const carIds = cars.map(car => car.id);
        if (carIds.length === 0) {
            console.error("Aucune voiture trouvée. Exécutez d'abord 'setup-db.js'.");
            return;
        }
        console.log(`${carIds.length} voitures trouvées.`);

        // 2. Vider la table des réservations pour éviter les doublons
        await connection.execute('DELETE FROM bookings');
        console.log("Anciennes réservations supprimées.");

        // 3. Générer 80 réservations aléatoires
        const bookingPromises = [];
        const numberOfBookings = 80;
        const today = new Date();
        const oneYearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));

        console.log(`Génération de ${numberOfBookings} réservations...`);
        for (let i = 0; i < numberOfBookings; i++) {
            const carId = carIds[Math.floor(Math.random() * carIds.length)];
            const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
            
            // Générer des dates de début et de fin logiques
            const startDate = getRandomDate(oneYearAgo, today);
            const rentalDuration = Math.floor(Math.random() * 14) + 1; // Durée de 1 à 15 jours
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + rentalDuration);

            const query = 'INSERT INTO bookings (car_id, start_date, end_date, customer_name, customer_phone, customer_email) VALUES (?, ?, ?, ?, ?, ?)';
            const values = [carId, startDate, endDate, customer.name, customer.phone, customer.email];
            bookingPromises.push(connection.execute(query, values));
        }

        await Promise.all(bookingPromises);
        console.log(`${numberOfBookings} réservations ont été insérées avec succès.`);

        console.log('\nFixtures de réservations générées ! ✨');

    } catch (error) {
        console.error('Une erreur est survenue lors de la génération des fixtures:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connexion fermée.');
        }
    }
}

generateFixtures();
