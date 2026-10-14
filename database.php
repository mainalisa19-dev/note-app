<?php
/**
 * database.php
 * PDO (SQLite by default) connection + schema for the `entities` table:
 * id, title, content, created_at, updated_at
 *
 * To use MySQL instead, change DB_DRIVER to 'mysql' and fill in the settings below.
 */

const DB_DRIVER = 'sqlite';          // 'sqlite' or 'mysql'
const DB_FILE   = __DIR__ . '/database.sqlite';

const DB_HOST   = '127.0.0.1';
const DB_NAME   = 'myapp';
const DB_USER   = 'root';
const DB_PASS   = '';

function getDB(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    if (DB_DRIVER === 'mysql') {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            $options
        );
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS entities (
                id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                title      VARCHAR(255) NOT NULL,
                content    TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } else {
        $pdo = new PDO('sqlite:' . DB_FILE, null, null, $options);
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS entities (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT NOT NULL,
                content    TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    return $pdo;
}

/* ---------- CRUD helpers ---------- */

function createEntity(string $title, ?string $content = null): int
{
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO entities (title, content) VALUES (:title, :content)");
    $stmt->execute([':title' => $title, ':content' => $content]);
    return (int) $db->lastInsertId();
}

function getEntity(int $id): ?array
{
    $stmt = getDB()->prepare("SELECT * FROM entities WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->fetch() ?: null;
}

function getAllEntities(): array
{
    return getDB()->query("SELECT * FROM entities ORDER BY created_at DESC")->fetchAll();
}

function updateEntity(int $id, string $title, ?string $content = null): bool
{
    $now = date('Y-m-d H:i:s');
    $stmt = getDB()->prepare(
        "UPDATE entities SET title = :title, content = :content, updated_at = :now WHERE id = :id"
    );
    $stmt->execute([':title' => $title, ':content' => $content, ':now' => $now, ':id' => $id]);
    return $stmt->rowCount() > 0;
}

function deleteEntity(int $id): bool
{
    $stmt = getDB()->prepare("DELETE FROM entities WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->rowCount() > 0;
}