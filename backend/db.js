const mysql = require('mysql2/promise');

// Utilise l'URL de la base de données de l'environnement de production, sinon la configuration locale
const connectionString = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/douala_rent';

// Crée un pool de connexions en utilisant soit l'URL de connexion, soit la configuration détaillée
const pool = mysql.createPool({
  uri: connectionString,
  // Ajoute la configuration SSL pour les bases de données en production qui le requièrent
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Exporter une fonction pour pouvoir exécuter des requêtes depuis n'importe où dans le backend
const query = async (sql, params) => {
    const [results, ] = await pool.execute(sql, params);
    return results;
}

module.exports = { query };
