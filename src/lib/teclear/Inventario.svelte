    <!-- Inventario: todos los artículos comprados en la tienda y todos los
         ganados con logros, ORDENADO EN SECCIONES igual que la tienda.
         Aquí se SELECCIONA lo que se lleva puesto (la tienda solo compra):
         cada tarjeta lleva su botón «Usar» / «Apagar» / «✓ En uso». -->
    <section class="inventario hidden" id="inventario">
        <div class="shop-head">
            <h2 id="invTitle">🎒 Inventario</h2>
            <span class="shop-coins">🎒 <span id="invCount">0</span></span>
        </div>
        <p class="shop-hint" id="invHint">Aquí se elige lo que se lleva puesto: pulsa «Usar» en el artículo que quieras. Todo lo que posees, comprado en la tienda o ganado con logros, se queda guardado para siempre.</p>

        <!-- Artículos del EVENTO de Halloween: su propia sección mientras
             dura el evento (igual que en la tienda) -->
        <h3 class="shop-sub inv-sub event-sub hidden" id="invEventTitle">🎃 Artículos de evento · Halloween</h3>
        <div class="shop-grid inv-grid hidden" id="invEventGrid"></div>

        <h3 class="shop-sub inv-sub" id="invFontsTitle">🔤 Estilos de letra</h3>
        <div class="shop-grid inv-grid" id="invFontGrid"></div>

        <h3 class="shop-sub inv-sub" id="invBgsTitle">🖼️ Fondos de pantalla</h3>
        <div class="shop-grid inv-grid" id="invBgGrid"></div>

        <h3 class="shop-sub inv-sub" id="invExtrasTitle">🔥 Extras de juego</h3>
        <div class="shop-grid inv-grid" id="invExtraGrid"></div>

        <h3 class="shop-sub inv-sub" id="invFxTitle">✨ Efectos de tecleo</h3>
        <div class="shop-grid inv-grid" id="invFxGrid"></div>

        <p class="shop-msg" id="invMsg"></p>
        <p class="inv-empty hidden" id="invEmpty">Todavía no tienes ningún artículo. ¡Ve a la tienda o completa logros!</p>
    </section>
