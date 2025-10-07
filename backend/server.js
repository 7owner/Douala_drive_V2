const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Import our new database module

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Middleware pour désactiver le cache pour les fichiers HTML
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Servir les fichiers statiques du répertoire parent (racine du projet)
// Cela permet de charger index.html, app.js, etc.
app.use(express.static(path.join(__dirname, '..')));

// --- NOUVELLES ROUTES API ---

// Endpoint pour récupérer toutes les voitures (avec option de filtrage par tag)
app.get('/api/cars', async (req, res) => {
    const { tag } = req.query;
    let query = 'SELECT * FROM cars';
    let params = [];

    if (tag) {
        query += ' WHERE JSON_CONTAINS(tags, JSON_QUOTE(?))';
        params.push(tag);
    }

    try {
        const cars = await db.query(query, params);
        const parsedCars = cars.map(car => ({
            ...car,
            features: car.features || [],
            details: car.details || [],
            tags: car.tags || [] // Ensure tags are parsed as well
        }));
        res.status(200).json(parsedCars);
    } catch (error) {
        console.error("Error fetching cars:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération des voitures." });
    }
});

// Endpoint pour récupérer tous les tags uniques disponibles
app.get('/api/tags', async (req, res) => {
    try {
        const result = await db.query('SELECT tags FROM cars');
        const allTags = new Set();
        result.forEach(row => {
            if (row.tags) {
                const carTags = JSON.parse(row.tags); // Tags are stored as JSON string
                carTags.forEach(tag => allTags.add(tag));
            }
        });
        res.status(200).json(Array.from(allTags));
    } catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération des tags." });
    }
});

// Endpoint pour récupérer les détails et les commentaires d'une voiture spécifique
app.get('/api/comments', async (req, res) => {
    const { car_id } = req.query;
    if (!car_id) {
        return res.status(400).json({ success: false, message: "L'ID de la voiture est requis." });
    }

    try {
        // 1. Récupérer les détails de la voiture
        const cars = await db.query('SELECT id, name, category, image FROM cars WHERE id = ?', [car_id]);
        if (cars.length === 0) {
            return res.status(404).json({ success: false, message: "Voiture non trouvée." });
        }
        const carDetails = cars[0];

        // 2. Récupérer les commentaires associés
        const comments = await db.query('SELECT author, rating, comment_text, created_at FROM comments WHERE car_id = ? ORDER BY created_at DESC', [car_id]);

        // 3. Renvoyer une réponse combinée
        res.status(200).json({ success: true, car: carDetails, comments: comments });

    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération des commentaires." });
    }
});

// --- ROUTES API ADMIN ---

// Endpoint pour récupérer toutes les voitures (pour l'admin)
app.get('/api/admin/cars', async (req, res) => {
    try {
        const cars = await db.query('SELECT * FROM cars');
        const parsedCars = cars.map(car => ({
            ...car,
            features: car.features || [],
            details: car.details || [],
            tags: car.tags || []
        }));
        res.status(200).json(parsedCars);
    } catch (error) {
        console.error("Error fetching admin cars:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération des voitures (admin)." });
    }
});

// Endpoint pour récupérer toutes les réservations (pour l'admin)
app.get('/api/admin/bookings', async (req, res) => {
    try {
        const bookings = await db.query(`
            SELECT b.*, c.name AS car_name, c.image AS car_image
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            ORDER BY b.start_date DESC
        `);
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching admin bookings:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération des réservations (admin)." });
    }
});

// Endpoint pour les statistiques d'aperçu (total voitures, total réservations)
app.get('/api/admin/stats/overview', async (req, res) => {
    try {
        const [totalCarsResult] = await db.query('SELECT COUNT(*) AS count FROM cars');
        const [totalBookingsResult] = await db.query('SELECT COUNT(*) AS count FROM bookings');
        
        res.status(200).json({
            totalCars: totalCarsResult.count,
            totalBookings: totalBookingsResult.count
        });
    } catch (error) {
        console.error("Error fetching overview stats:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération des statistiques d'aperçu." });
    }
});

// Endpoint pour les voitures les plus sollicitées
app.get('/api/admin/stats/most-requested-cars', async (req, res) => {
    try {
        const mostRequested = await db.query(`
            SELECT c.name AS car_name, COUNT(b.id) AS booking_count
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            GROUP BY c.id, c.name
            ORDER BY booking_count DESC
            LIMIT 5
        `);
        res.status(200).json(mostRequested);
    } catch (error) {
        console.error("Error fetching most requested cars:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération des voitures les plus sollicitées." });
    }
});

// Endpoint pour les réservations par mois
app.get('/api/admin/stats/bookings-per-month', async (req, res) => {
    try {
        const bookingsPerMonth = await db.query(`
            SELECT
                DATE_FORMAT(start_date, '%Y-%m') AS month,
                COUNT(id) AS booking_count
            FROM bookings
            GROUP BY month
            ORDER BY month;
        `);
        res.status(200).json(bookingsPerMonth);
    } catch (error) {
        console.error("Error fetching bookings per month:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération des réservations par mois." });
    }
});

// Endpoint pour la popularité des voitures
app.get('/api/admin/stats/car-popularity', async (req, res) => {
    try {
        const carPopularity = await db.query(`
            SELECT
                c.name AS car_name,
                COUNT(b.id) AS booking_count
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            GROUP BY c.id, c.name
            ORDER BY booking_count DESC;
        `);
        res.status(200).json(carPopularity);
    } catch (error) {
        console.error("Error fetching car popularity:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération de la popularité des voitures." });
    }
});

// Endpoint pour le taux d'utilisation des voitures
app.get('/api/admin/stats/utilization', async (req, res) => {
    try {
        const carUtilization = await db.query(`
            SELECT
                c.name AS car_name,
                c.quantity AS total_quantity,
                COUNT(b.id) AS booking_count
            FROM cars c
            LEFT JOIN bookings b ON c.id = b.car_id
            GROUP BY c.id, c.name, c.quantity
            ORDER BY booking_count DESC;
        `);
        res.status(200).json(carUtilization);
    } catch (error) {
        console.error("Error fetching car utilization:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la récupération de l'utilisation des voitures." });
    }
});

// --- ROUTES API ADMIN (CRUD) ---

// POST /api/admin/cars - Ajouter une nouvelle voiture
app.post('/api/admin/cars', async (req, res) => {
    const { name, category, price, image, features, details, quantity, tags } = req.body;
    if (!name || !price || !image || !quantity) {
        return res.status(400).json({ success: false, message: "Nom, prix, image et quantité sont requis." });
    }
    try {
        const query = 'INSERT INTO cars (name, category, price, image, features, details, quantity, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [name, category, price, image, JSON.stringify(features || []), JSON.stringify(details || []), quantity, JSON.stringify(tags || [])];
        const result = await db.query(query, values);
        res.status(201).json({ success: true, message: "Voiture ajoutée avec succès.", id: result.insertId });
    } catch (error) {
        console.error("Error adding car:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de l'ajout de la voiture." });
    }
});

// PUT /api/admin/cars/:id - Modifier une voiture existante
app.put('/api/admin/cars/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category, price, image, features, details, quantity, tags } = req.body;
    if (!name || !price || !image || !quantity) {
        return res.status(400).json({ success: false, message: "Nom, prix, image et quantité sont requis." });
    }
    try {
        const query = 'UPDATE cars SET name = ?, category = ?, price = ?, image = ?, features = ?, details = ?, quantity = ?, tags = ? WHERE id = ?';
        const values = [name, category, price, image, JSON.stringify(features || []), JSON.stringify(details || []), quantity, JSON.stringify(tags || []), id];
        const result = await db.query(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Voiture non trouvée." });
        }
        res.status(200).json({ success: true, message: "Voiture mise à jour avec succès." });
    } catch (error) {
        console.error("Error updating car:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la mise à jour de la voiture." });
    }
});

// DELETE /api/admin/cars/:id - Supprimer une voiture
app.delete('/api/admin/cars/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Optionnel: Vérifier s'il y a des réservations actives pour cette voiture avant de supprimer
        const [bookings] = await db.query('SELECT COUNT(*) AS count FROM bookings WHERE car_id = ?', [id]);
        if (bookings[0].count > 0) {
            return res.status(409).json({ success: false, message: "Impossible de supprimer la voiture car elle a des réservations actives." });
        }

        const result = await db.query('DELETE FROM cars WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Voiture non trouvée." });
        }
        res.status(200).json({ success: true, message: "Voiture supprimée avec succès." });
    } catch (error) {
        console.error("Error deleting car:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la suppression de la voiture." });
    }
});

// DELETE /api/admin/bookings/:id - Annuler une réservation
app.delete('/api/admin/bookings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const booking = await db.query('SELECT car_id FROM bookings WHERE id = ?', [id]);
        if (booking.length === 0) {
            return res.status(404).json({ success: false, message: "Réservation non trouvée." });
        }

        const result = await db.query('DELETE FROM bookings WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Réservation non trouvée." });
        }

        // Incrémenter la quantité de la voiture correspondante
        await db.query('UPDATE cars SET quantity = quantity + 1 WHERE id = ?', [booking[0].car_id]);

        res.status(200).json({ success: true, message: "Réservation annulée avec succès." });
    } catch (error) {
        console.error("Error canceling booking:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de l'annulation de la réservation." });
    }
});

// Endpoint pour créer une réservation (avec vérification de conflit)
app.post('/api/booking', async (req, res) => {
    const { car_id, start_date, end_date, name, phone, email } = req.body;

    // Validation simple
    if (!car_id || !start_date || !end_date || !name) {
        return res.status(400).json({ success: false, message: "Informations manquantes." });
    }

    try {
        // 1. Vérifier la disponibilité de la quantité
        const carsResult = await db.query('SELECT quantity FROM cars WHERE id = ?', [car_id]);
        const car = carsResult[0]; // Get the first (and only) row
        if (!car || car.quantity <= 0) {
            return res.status(409).json({ success: false, message: "Désolé, ce modèle de véhicule n'est plus disponible." });
        }

        // 2. Vérifier les conflits de réservation (dates)
        const overlappingBookings = await db.query(
            `SELECT id FROM bookings 
             WHERE car_id = ? AND (
                (start_date <= ? AND end_date >= ?) OR 
                (start_date <= ? AND end_date >= ?) OR
                (start_date >= ? AND end_date <= ?)
             )`,
            [car_id, end_date, start_date, start_date, end_date, start_date, end_date]
        );

        if (overlappingBookings.length >= car.quantity) { // Check against available quantity
            // Conflit trouvé, toutes les unités sont déjà réservées pour cette période
            return res.status(409).json({ // 409 Conflict
                success: false, 
                message: 'Désolé, toutes les unités de ce véhicule sont déjà réservées pour la période sélectionnée. Veuillez choisir d\'autres dates.' 
            });
        }

        // 3. Si pas de conflit et quantité disponible, insérer la nouvelle réservation
        const insertQuery = `
            INSERT INTO bookings (car_id, start_date, end_date, customer_name, customer_phone, customer_email)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.query(insertQuery, [car_id, start_date, end_date, name, phone, email]);

        // 4. Décrémenter la quantité de la voiture
        const updateResult = await db.query('UPDATE cars SET quantity = quantity - 1 WHERE id = ?', [car_id]);

        res.status(201).json({ // 201 Created
            success: true, 
            message: 'Réservation confirmée ! Vous recevrez bientôt un email de confirmation.' 
        });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ success: false, message: "Erreur du serveur lors de la création de la réservation." });
    }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur DoualaLuxuryRent (version DB) démarré sur le port ${port}`);
  console.log(`Accédez à l'application sur http://localhost:${port}`);
});
