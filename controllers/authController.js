
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';

export const register = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Faltan campos obligatorios.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
        res.status(201).json({ message: 'Usuario registrado correctamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar usuario.' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta.' });

        const token = jwt.sign({ id: user.id, role: user.role }, 'secret', { expiresIn: '1d' });
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en inicio de sesión.' });
    }

    document.getElementById("register-form").addEventListener("submit", handleRegister);

    async function handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById("register-name").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const role = document.getElementById("register-role").value;
        const messageBox = document.getElementById("register-message");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();

            if (!res.ok) {
                messageBox.textContent = data.error || "Error en el registro.";
                messageBox.style.color = "red";
            } else {
                messageBox.textContent = "Registro exitoso. Ya puedes iniciar sesión.";
                messageBox.style.color = "green";
            }
            messageBox.style.display = "block";
        } catch (err) {
            messageBox.textContent = "Error del servidor o de red.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
        }
    }

    document.getElementById("login-form").addEventListener("submit", handleLogin);

    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const messageBox = document.getElementById("login-message");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                messageBox.textContent = data.error || "Credenciales incorrectas.";
                messageBox.style.color = "red";
            } else {
                messageBox.textContent = "Inicio de sesión exitoso.";
                messageBox.style.color = "green";
                // Aquí deberías continuar con la lógica para mostrar el dashboard
                // Por ejemplo: app.loginUser(data.user);
            }
            messageBox.style.display = "block";
        } catch (err) {
            messageBox.textContent = "Error del servidor o de red.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
        }
    }


};
