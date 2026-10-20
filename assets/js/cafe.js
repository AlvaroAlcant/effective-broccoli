        let brewing = false;

        function brewCoffee() {
            if (brewing) return;
            brewing = true;

            const btn = document.getElementById('brewBtn');
            const coffee = document.getElementById('coffee');
            const steam = document.getElementById('steam');
            const status = document.getElementById('status');

            btn.disabled = true;
            status.textContent = 'Preparando café...';
            steam.classList.remove('visible');
            coffee.classList.remove('full');

            setTimeout(() => {
                coffee.classList.add('full');
                steam.classList.add('visible');
                status.textContent = '¡Tu café está listo! ☕';
                btn.disabled = false;
                btn.textContent = 'Preparar otro';
                brewing = false;
            }, 2000);
        }
