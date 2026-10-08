import {
  isFirebaseConfigured,
  signIn,
  logOut,
  onAuthChange,
  authErrorMessage,
} from './firebase-auth.js';

const PAGE_HEROES = [
  ['hero_services', 'Our Services page'],
  ['hero_booking', 'Booking page'],
  ['hero_activities', 'Activities page'],
  ['hero_kalongo', 'Our Kalongo page'],
  ['hero_pricing', 'Pricing page'],
];

const NAV = [
  'dashboard', 'hero', 'page-heroes', 'rooms', 'facilities', 'activities',
  'pricing', 'food', 'restaurant-menu', 'videos', 'gallery', 'reviews', 'settings',
];

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const authLoading = document.getElementById('auth-loading');
const viewEl = document.getElementById('view');
const flashHost = document.getElementById('flash-host');
const loginFlash = document.getElementById('login-flash');

let data = null;
let currentUser = null;
let nested = { type: null, id: null };
let authReady = false;

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function thumbHtml(url) {
  const src = String(url || '').trim();
  if (!src) return '—';
  return `<img src="${esc(src)}" class="thumb" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.alt='Missing';this.style.opacity='0.35';">`;
}

function flash(msg, kind = 'success') {
  flashHost.innerHTML = `<div class="flash ${kind}">${esc(msg)}</div>`;
  setTimeout(() => { if (flashHost.textContent.trim() === msg) flashHost.innerHTML = ''; }, 4000);
}

function loginError(msg) {
  loginFlash.innerHTML = msg ? `<div class="flash error">${esc(msg)}</div>` : '';
}

function route() {
  const hash = (location.hash || '#dashboard').replace('#', '').split('/')[0];
  return NAV.includes(hash) ? hash : 'dashboard';
}

function setActiveNav() {
  const r = route();
  document.querySelectorAll('#admin-nav a[data-route]').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === r);
  });
}

async function persist() {
  try {
    await window.KalongoContent.publish(data);
    return true;
  } catch (err) {
    flash(err.message || 'Could not save changes.', 'error');
    return false;
  }
}

async function mediaValue(fileInput, urlInput) {
  if (fileInput && fileInput.files && fileInput.files[0]) {
    return window.KalongoContent.uploadToCloudinary(fileInput.files[0]);
  }
  return (urlInput && urlInput.value ? urlInput.value : '').trim();
}

function nid() {
  return window.KalongoContent.nextId(data);
}

function listByOrder(arr) {
  return [...(arr || [])].sort((a, b) => (a.order || 0) - (b.order || 0) || (a.id || 0) - (b.id || 0));
}

function closeMobile() {
  document.getElementById('sidebar')?.classList.remove('active');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
  document.getElementById('mobileMenuToggle')?.classList.remove('active');
  const icon = document.getElementById('menuIcon');
  if (icon) icon.textContent = '☰';
  document.body.style.overflow = '';
}

function renderDashboard() {
  viewEl.innerHTML = `
    <h2>Dashboard</h2>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Overview of your Kalongo Farm content.</p>
    <div class="grid">
      <a href="#hero" class="stat" style="text-decoration:none;color:inherit;"><span>${data.hero_slides.length}</span><p>Hero Slides</p></a>
      <a href="#rooms" class="stat" style="text-decoration:none;color:inherit;"><span>${data.rooms.length}</span><p>Rooms</p></a>
      <a href="#facilities" class="stat" style="text-decoration:none;color:inherit;"><span>${data.facilities.length}</span><p>Facilities</p></a>
      <a href="#activities" class="stat" style="text-decoration:none;color:inherit;"><span>${data.activities.length}</span><p>Activities</p></a>
      <a href="#pricing" class="stat" style="text-decoration:none;color:inherit;"><span>${data.pricing.length}</span><p>Pricing Categories</p></a>
      <a href="#food" class="stat" style="text-decoration:none;color:inherit;"><span>${data.food.length}</span><p>Food Items</p></a>
      <a href="#restaurant-menu" class="stat" style="text-decoration:none;color:inherit;"><span>${data.restaurant_menu.length}</span><p>Restaurant Menu</p></a>
      <a href="#videos" class="stat" style="text-decoration:none;color:inherit;"><span>${data.videos.length}</span><p>Videos</p></a>
      <a href="#reviews" class="stat" style="text-decoration:none;color:inherit;"><span>${data.reviews.length}</span><p>Reviews</p></a>
    </div>`;
}

function renderHero() {
  const rows = listByOrder(data.hero_slides).map((s) => `
    <tr>
      <td data-label="Preview">${thumbHtml(s.image_url)}</td>
      <td data-label="Title">${esc(s.title || '—')}</td>
      <td data-label="Order">${esc(s.order)}</td>
      <td data-label="Actions"><button class="btn btn-danger btn-sm" data-del="${s.id}">Delete</button></td>
    </tr>`).join('') || `<tr><td colspan="4" style="color:var(--text-muted);">No slides yet.</td></tr>`;
  viewEl.innerHTML = `
    <h2>Hero Slides</h2>
    <p style="color:var(--text-muted);margin-bottom:1rem;">Manage homepage hero carousel images.</p>
    <div class="card">
      <h3>Add slide</h3>
      <form id="add-hero">
        <div class="form-row">
          <div><label>Image (file)</label><input type="file" name="image" accept="image/*"></div>
          <div><label>Or image URL</label><input type="url" name="image_url" placeholder="https://..."></div>
        </div>
        <div class="form-row">
          <div><label>Title</label><input type="text" name="title"></div>
          <div><label>Subtitle</label><input type="text" name="subtitle"></div>
        </div>
        <div><label>Order</label><input type="number" name="order" value="0"></div>
        <button type="submit" class="btn btn-primary">Add slide</button>
      </form>
    </div>
    <div class="card">
      <h3>Current slides</h3>
      <table><thead><tr><th>Preview</th><th>Title</th><th>Order</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  viewEl.querySelector('#add-hero').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const url = await mediaValue(f.image, f.image_url);
      if (!url) return flash('Choose an image file or paste a URL.', 'error');
      data.hero_slides.push({
        id: nid(), image_url: url, title: f.title.value, subtitle: f.subtitle.value,
        order: Number(f.order.value) || 0, active: true,
      });
      if (!(await persist())) return;
      flash('Hero slide added.');
      render();
    } catch (err) { flash(err.message, 'error'); }
  });
  viewEl.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      data.hero_slides = data.hero_slides.filter((s) => String(s.id) !== btn.dataset.del);
      if (!(await persist())) return;
      flash('Slide deleted.');
      render();
    });
  });
}

function renderPageHeroes() {
  viewEl.innerHTML = `<h2>Page hero backgrounds</h2>
    <p style="color:var(--text-muted);margin-bottom:1rem;">Change the hero (top banner) background image for each page. Homepage hero is managed under <strong>Hero Slides</strong>.</p>
    ${PAGE_HEROES.map(([key, label]) => {
      const url = data.settings[key] || '';
      return `<div class="card">
        <h3>${esc(label)}</h3>
        ${url ? `<img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer" style="max-width:320px;max-height:160px;object-fit:cover;border-radius:8px;display:block;margin-bottom:.75rem;" onerror="this.alt='Missing';this.style.opacity='0.35';">` : `<p style="color:var(--text-muted);margin-bottom:.75rem;">Using default image.</p>`}
        <form data-hero-key="${key}">
          <div class="form-row">
            <div><label>Image (file)</label><input type="file" name="image" accept="image/*"></div>
            <div><label>Or image URL</label><input type="url" name="image_url" placeholder="https://..."></div>
          </div>
          <button type="submit" class="btn btn-primary">Save hero image</button>
        </form>
        ${url ? `<p style="margin-top:.5rem;"><button class="btn btn-secondary btn-sm" data-clear="${key}">Reset to default</button></p>` : ''}
      </div>`;
    }).join('')}`;
  viewEl.querySelectorAll('form[data-hero-key]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const url = await mediaValue(form.image, form.image_url);
        if (!url) return flash('Choose an image file or paste a URL.', 'error');
        data.settings[form.dataset.heroKey] = url;
        if (!(await persist())) return;
        flash('Hero updated.');
        render();
      } catch (err) { flash(err.message, 'error'); }
    });
  });
  viewEl.querySelectorAll('[data-clear]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      data.settings[btn.dataset.clear] = '';
      if (!(await persist())) return;
      flash('Hero reset to default.');
      render();
    });
  });
}

function renderRoomEdit(room) {
  const features = (room.features || []).join('\n');
  viewEl.innerHTML = `
    <h2>Edit Room: ${esc(room.name)}</h2>
    <div class="card">
      <form id="edit-room">
        <div><label>Room Name *</label><input name="name" value="${esc(room.name)}" required></div>
        <div><label>Slug</label><input value="${esc(room.slug)}" disabled></div>
        <div><label>Capacity</label><input name="capacity" value="${esc(room.capacity || '')}"></div>
        <div><label>Description</label><textarea name="description" rows="4">${esc(room.description || '')}</textarea></div>
        <div><label>Features (one per line)</label><textarea name="features" rows="8">${esc(features)}</textarea></div>
        <div><label>Order</label><input type="number" name="order" value="${esc(room.order || 0)}"></div>
        <div class="actions">
          <button class="btn btn-primary" type="submit">Save Changes</button>
          <a class="btn btn-secondary" href="#rooms">Cancel</a>
        </div>
      </form>
    </div>`;
  viewEl.querySelector('#edit-room').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    room.name = f.name.value;
    room.capacity = f.capacity.value;
    room.description = f.description.value;
    room.features = f.features.value.split('\n').map((x) => x.trim()).filter(Boolean);
    room.order = Number(f.order.value) || 0;
    if (!(await persist())) return;
    nested = { type: null, id: null };
    location.hash = 'rooms';
    flash('Room saved.');
  });
}

function renderRoomImages(room) {
  const rows = listByOrder(room.images || []).map((img) => `
    <tr>
      <td>${thumbHtml(img.image_url)}</td>
      <td>${esc(img.caption || '—')}</td>
      <td>${esc(img.order)}</td>
      <td><button class="btn btn-danger btn-sm" data-del="${img.id}">Delete</button></td>
    </tr>`).join('') || `<tr><td colspan="4" style="color:var(--text-muted);">No images yet.</td></tr>`;
  viewEl.innerHTML = `
    <h2>Images: ${esc(room.name)}</h2>
    <p style="margin-bottom:1rem;"><a href="#rooms">← Back to rooms</a></p>
    <div class="card">
      <h3>Add image</h3>
      <form id="add-rimg">
        <div class="form-row">
          <div><label>Image (file)</label><input type="file" name="image" accept="image/*"></div>
          <div><label>Or image URL</label><input type="url" name="image_url"></div>
        </div>
        <div class="form-row">
          <div><label>Caption</label><input name="caption"></div>
          <div><label>Order</label><input type="number" name="order" value="0"></div>
        </div>
        <button class="btn btn-primary" type="submit">Add image</button>
      </form>
    </div>
    <div class="card"><h3>Images</h3><table><thead><tr><th>Preview</th><th>Caption</th><th>Order</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  viewEl.querySelector('#add-rimg').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const url = await mediaValue(f.image, f.image_url);
      if (!url) return flash('Choose an image file or paste a URL.', 'error');
      room.images = room.images || [];
      room.images.push({ id: nid(), image_url: url, caption: f.caption.value, order: Number(f.order.value) || 0 });
      if (!(await persist())) return;
      flash('Image added.');
      render();
    } catch (err) { flash(err.message, 'error'); }
  });
  viewEl.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      room.images = (room.images || []).filter((i) => String(i.id) !== btn.dataset.del);
      if (!(await persist())) return;
      flash('Image deleted.');
      render();
    });
  });
}

function renderRooms() {
  if (nested.type === 'room-edit') {
    const room = data.rooms.find((r) => String(r.id) === String(nested.id));
    if (room) return renderRoomEdit(room);
  }
  if (nested.type === 'room-images') {
    const room = data.rooms.find((r) => String(r.id) === String(nested.id));
    if (room) return renderRoomImages(room);
  }
  const rows = listByOrder(data.rooms).map((r) => `
    <tr>
      <td data-label="Room">${esc(r.name)}</td>
      <td data-label="Slug"><code>${esc(r.slug)}</code></td>
      <td data-label="Capacity">${esc(r.capacity || '—')}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-edit="${r.id}">Edit</button>
        <button class="btn btn-primary btn-sm" data-imgs="${r.id}">Images</button>
        <button class="btn btn-danger btn-sm" data-del="${r.id}">Delete</button>
      </td>
    </tr>`).join('');
  viewEl.innerHTML = `
    <h2>Rooms</h2>
    <p style="color:var(--text-muted);margin-bottom:1rem;">Manage accommodation types: A-Cabin, Cottage, Kikota, Family House.</p>
    <div class="card">
      <h3>Add Room</h3>
      <form id="add-room">
        <div class="form-row">
          <div><label>Name *</label><input name="name" required></div>
          <div><label>Slug *</label><input name="slug" required placeholder="a-cabin"></div>
        </div>
        <div><label>Capacity</label><input name="capacity"></div>
        <div><label>Description</label><textarea name="description" rows="3"></textarea></div>
        <button class="btn btn-primary" type="submit">Add Room</button>
      </form>
    </div>
    <div class="card"><h3>All Rooms</h3>
      <table><thead><tr><th>Room</th><th>Slug</th><th>Capacity</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  viewEl.querySelector('#add-room').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const slug = f.slug.value.trim().toLowerCase().replace(/\s+/g, '-');
    if (data.rooms.some((r) => r.slug === slug)) return flash('That slug already exists.', 'error');
    data.rooms.push({
      id: nid(), name: f.name.value, slug, description: f.description.value,
      capacity: f.capacity.value, features: [], order: data.rooms.length, images: [],
    });
    if (!(await persist())) return;
    flash('Room added.');
    render();
  });
  viewEl.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    nested = { type: 'room-edit', id: b.dataset.edit };
    render();
  }));
  viewEl.querySelectorAll('[data-imgs]').forEach((b) => b.addEventListener('click', () => {
    nested = { type: 'room-images', id: b.dataset.imgs };
    render();
  }));
  viewEl.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Delete this room?')) return;
    data.rooms = data.rooms.filter((r) => String(r.id) !== b.dataset.del);
    if (!(await persist())) return;
    flash('Room deleted.');
    render();
  }));
}

function simpleCollection(opts) {
  const key = opts.key;
  const title = opts.title;
  const fields = opts.fields;
  const rows = listByOrder(data[key]).map((item) => `
    <tr>
      ${opts.columns.map((c) => `<td>${c === 'image_url' ? thumbHtml(item[c]) : esc(item[c] ?? '—')}</td>`).join('')}
      <td><button class="btn btn-danger btn-sm" data-del="${item.id}">Delete</button></td>
    </tr>`).join('') || `<tr><td colspan="${opts.columns.length + 1}" style="color:var(--text-muted);">None yet.</td></tr>`;
  viewEl.innerHTML = `
    <h2>${esc(title)}</h2>
    <div class="card">
      <h3>Add</h3>
      <form id="add-item">${fields}${opts.media ? `
        <div class="form-row">
          <div><label>Image (file)</label><input type="file" name="image" accept="image/*,video/*"></div>
          <div><label>Or URL</label><input type="url" name="image_url"></div>
        </div>` : ''}
        <button class="btn btn-primary" type="submit">Add</button>
      </form>
    </div>
    <div class="card">
      <table><thead><tr>${opts.headers.map((h) => `<th>${h}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  viewEl.querySelector('#add-item').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const item = { id: nid(), order: Number(f.order?.value) || data[key].length };
      opts.assign(item, f);
      if (opts.media) {
        const url = await mediaValue(f.image, f.image_url);
        if (opts.media === 'url') item.url = url || item.url;
        else item.image_url = url || item.image_url;
        if (opts.media === 'required' && !item.image_url && !item.url) {
          return flash('Choose a file or paste a URL.', 'error');
        }
      }
      data[key].push(item);
      if (!(await persist())) return;
      flash('Saved.');
      render();
    } catch (err) { flash(err.message, 'error'); }
  });
  viewEl.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    data[key] = data[key].filter((i) => String(i.id) !== b.dataset.del);
    if (!(await persist())) return;
    flash('Deleted.');
    render();
  }));
}

function renderFacilities() {
  simpleCollection({
    key: 'facilities', title: 'Facilities',
    headers: ['Preview', 'Name', 'Order'], columns: ['image_url', 'name', 'order'],
    media: 'image',
    fields: `<div class="form-row"><div><label>Name</label><input name="name" required></div><div><label>Order</label><input type="number" name="order" value="0"></div></div>
      <div><label>Description</label><textarea name="description" rows="3"></textarea></div>`,
    assign: (item, f) => { item.name = f.name.value; item.description = f.description.value; item.order = Number(f.order.value) || 0; },
  });
}

function renderActivities() {
  simpleCollection({
    key: 'activities', title: 'Activities',
    headers: ['Preview', 'Name', 'Order'], columns: ['image_url', 'name', 'order'],
    media: 'image',
    fields: `<div class="form-row"><div><label>Name</label><input name="name" required></div><div><label>Order</label><input type="number" name="order" value="0"></div></div>
      <div><label>Description</label><textarea name="description" rows="3"></textarea></div>`,
    assign: (item, f) => { item.name = f.name.value; item.description = f.description.value; item.order = Number(f.order.value) || 0; },
  });
}

function renderFood() {
  simpleCollection({
    key: 'food', title: 'Food',
    headers: ['Name', 'Price', 'Order'], columns: ['name', 'price', 'order'],
    fields: `<div class="form-row"><div><label>Name</label><input name="name" required></div><div><label>Price</label><input name="price" required></div></div>
      <div><label>Description</label><input name="description"></div>
      <div><label>Order</label><input type="number" name="order" value="0"></div>`,
    assign: (item, f) => {
      item.name = f.name.value; item.price = f.price.value;
      item.description = f.description.value; item.featured = false;
      item.order = Number(f.order.value) || 0;
    },
  });
}

function renderVideos() {
  simpleCollection({
    key: 'videos', title: 'Videos',
    headers: ['Caption', 'Section', 'Order'], columns: ['caption', 'section', 'order'],
    media: 'url',
    fields: `<div class="form-row"><div><label>Caption</label><input name="caption"></div><div><label>Section</label><input name="section" value="our-kalongo"></div></div>
      <div><label>Order</label><input type="number" name="order" value="0"></div>`,
    assign: (item, f) => {
      item.caption = f.caption.value; item.section = f.section.value;
      item.order = Number(f.order.value) || 0; item.url = '';
    },
  });
}

function renderGallery() {
  simpleCollection({
    key: 'gallery_images', title: 'Gallery',
    headers: ['Preview', 'Caption', 'Order'], columns: ['image_url', 'caption', 'order'],
    media: 'required',
    fields: `<div class="form-row"><div><label>Caption</label><input name="caption"></div><div><label>Section</label><input name="section" value="our-kalongo"></div></div>
      <div><label>Order</label><input type="number" name="order" value="0"></div>`,
    assign: (item, f) => {
      item.caption = f.caption.value; item.section = f.section.value;
      item.order = Number(f.order.value) || 0;
    },
  });
}

function renderReviews() {
  simpleCollection({
    key: 'reviews', title: 'Reviews',
    headers: ['Photo', 'Name', 'Rating'], columns: ['image_url', 'customer_name', 'rating'],
    media: 'image',
    fields: `<div class="form-row"><div><label>Customer name</label><input name="customer_name"></div><div><label>Rating</label><input type="number" name="rating" value="5" min="1" max="5"></div></div>
      <div><label>Quote</label><textarea name="quote" rows="3"></textarea></div>
      <div><label>Order</label><input type="number" name="order" value="0"></div>`,
    assign: (item, f) => {
      item.customer_name = f.customer_name.value; item.quote = f.quote.value;
      item.rating = Number(f.rating.value) || 5; item.order = Number(f.order.value) || 0;
    },
  });
}

function renderPricing() {
  const cats = listByOrder(data.pricing).map((cat) => `
    <div class="card">
      <h3>${esc(cat.name)}</h3>
      <p style="color:var(--text-muted);margin-bottom:1rem;">${esc(cat.description || '')}</p>
      <table>
        <thead><tr><th>Name</th><th>Label</th><th>Price</th><th></th></tr></thead>
        <tbody>
          ${listByOrder(cat.items).map((it) => `<tr>
            <td>${esc(it.name)}</td><td>${esc(it.price_label || '')}</td><td>${esc(it.price_value)}</td>
            <td><button class="btn btn-danger btn-sm" data-cat="${cat.id}" data-del="${it.id}">Delete</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <form data-add-item="${cat.id}" style="margin-top:1rem;">
        <div class="form-row">
          <div><label>Name</label><input name="name" required></div>
          <div><label>Price label</label><input name="price_label"></div>
          <div><label>Price</label><input name="price_value" required></div>
        </div>
        <button class="btn btn-primary btn-sm" type="submit">Add item</button>
      </form>
    </div>`).join('');
  viewEl.innerHTML = `<h2>Pricing</h2>${cats}
    <div class="card">
      <h3>Add category</h3>
      <form id="add-pcat">
        <div class="form-row">
          <div><label>Name</label><input name="name" required></div>
          <div><label>Type</label><input name="category_type" placeholder="accommodation"></div>
        </div>
        <div><label>Description</label><input name="description"></div>
        <button class="btn btn-primary" type="submit">Add category</button>
      </form>
    </div>`;
  viewEl.querySelector('#add-pcat').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    data.pricing.push({
      id: nid(), name: f.name.value, description: f.description.value,
      category_type: f.category_type.value, order: data.pricing.length, items: [],
    });
    if (!(await persist())) return;
    flash('Category added.');
    render();
  });
  viewEl.querySelectorAll('form[data-add-item]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cat = data.pricing.find((c) => String(c.id) === form.dataset.addItem);
      cat.items.push({
        id: nid(), name: form.name.value, price_label: form.price_label.value,
        price_value: form.price_value.value, description: '', featured: false, order: cat.items.length,
      });
      if (!(await persist())) return;
      flash('Item added.');
      render();
    });
  });
  viewEl.querySelectorAll('[data-del]').forEach((b) => {
    b.addEventListener('click', async () => {
      const cat = data.pricing.find((c) => String(c.id) === b.dataset.cat);
      cat.items = cat.items.filter((i) => String(i.id) !== b.dataset.del);
      if (!(await persist())) return;
      flash('Item deleted.');
      render();
    });
  });
}

function renderMenu() {
  if (nested.type === 'menu-items') {
    const cat = data.restaurant_menu.find((c) => String(c.id) === String(nested.id));
    if (cat) {
      const rows = listByOrder(cat.items).map((it) => `<tr>
        <td>${esc(it.name)}</td><td>${esc(it.price)}</td>
        <td><button class="btn btn-danger btn-sm" data-del="${it.id}">Delete</button></td>
      </tr>`).join('');
      viewEl.innerHTML = `<h2>${esc(cat.name)} items</h2>
        <p><a href="#restaurant-menu">← Back</a></p>
        <div class="card">
          <form id="add-mi">
            <div class="form-row">
              <div><label>Name</label><input name="name" required></div>
              <div><label>Price</label><input name="price" required></div>
            </div>
            <button class="btn btn-primary" type="submit">Add item</button>
          </form>
        </div>
        <div class="card"><table><thead><tr><th>Name</th><th>Price</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
      viewEl.querySelector('#add-mi').addEventListener('submit', async (e) => {
        e.preventDefault();
        cat.items.push({ id: nid(), name: e.target.name.value, price: e.target.price.value, order: cat.items.length });
        if (!(await persist())) return;
        flash('Item added.');
        render();
      });
      viewEl.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
        cat.items = cat.items.filter((i) => String(i.id) !== b.dataset.del);
        if (!(await persist())) return;
        render();
      }));
      return;
    }
  }
  const rows = listByOrder(data.restaurant_menu).map((c) => `<tr>
    <td>${thumbHtml(c.image_url)}</td>
    <td>${esc(c.name)}</td>
    <td>${c.items?.length || 0}</td>
    <td class="actions">
      <button class="btn btn-primary btn-sm" data-items="${c.id}">Items</button>
      <button class="btn btn-danger btn-sm" data-del="${c.id}">Delete</button>
    </td>
  </tr>`).join('');
  viewEl.innerHTML = `<h2>Restaurant Menu</h2>
    <div class="card">
      <h3>Add category</h3>
      <form id="add-mcat">
        <div class="form-row"><div><label>Name</label><input name="name" required></div><div><label>Subtitle</label><input name="subtitle"></div></div>
        <div class="form-row">
          <div><label>Image (file)</label><input type="file" name="image" accept="image/*"></div>
          <div><label>Or URL</label><input type="url" name="image_url"></div>
        </div>
        <button class="btn btn-primary" type="submit">Add category</button>
      </form>
    </div>
    <div class="card"><table><thead><tr><th>Image</th><th>Name</th><th>Items</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  viewEl.querySelector('#add-mcat').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const url = await mediaValue(f.image, f.image_url);
      data.restaurant_menu.push({
        id: nid(), name: f.name.value, subtitle: f.subtitle.value,
        image_url: url, icon_key: '', order: data.restaurant_menu.length, items: [],
      });
      if (!(await persist())) return;
      flash('Category added.');
      render();
    } catch (err) { flash(err.message, 'error'); }
  });
  viewEl.querySelectorAll('[data-items]').forEach((b) => b.addEventListener('click', () => {
    nested = { type: 'menu-items', id: b.dataset.items };
    render();
  }));
  viewEl.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    data.restaurant_menu = data.restaurant_menu.filter((c) => String(c.id) !== b.dataset.del);
    if (!(await persist())) return;
    render();
  }));
}

function renderSettings() {
  const s = data.settings || {};
  viewEl.innerHTML = `<h2>Site settings</h2>
    <p style="color:var(--text-muted);margin-bottom:1rem;">Phone, email, address, social links, logo, and about text.</p>
    <div class="card">
      <form id="settings-form">
        <div class="form-row">
          <div><label>Phone</label><input name="phone" value="${esc(s.phone || '')}"></div>
          <div><label>WhatsApp</label><input name="whatsapp" value="${esc(s.whatsapp || '')}"></div>
          <div><label>Email</label><input type="email" name="email" value="${esc(s.email || '')}"></div>
        </div>
        <div><label>Address</label><input name="address" value="${esc(s.address || '')}"></div>
        <div><label>Map coordinates (lat,lng)</label><input name="map_coordinates" value="${esc(s.map_coordinates || '')}"></div>
        <div class="form-row">
          <div><label>Instagram URL</label><input name="instagram" value="${esc(s.instagram || '')}"></div>
          <div><label>Facebook URL</label><input name="facebook" value="${esc(s.facebook || '')}"></div>
        </div>
        <div><label>Logo URL</label><input name="logo_url" value="${esc(s.logo_url || '')}"></div>
        <div><label>About text</label><textarea name="about_text" rows="4">${esc(s.about_text || '')}</textarea></div>
        <div style="margin:1rem 0;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" name="show_prices" ${s.show_prices === 'true' ? 'checked' : ''} style="width:auto;margin:0;">
            <span><strong>Show prices on website</strong></span>
          </label>
        </div>
        <button class="btn btn-primary" type="submit">Save settings</button>
      </form>
    </div>`;
  viewEl.querySelector('#settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    ['phone', 'whatsapp', 'email', 'address', 'map_coordinates', 'instagram', 'facebook', 'logo_url', 'about_text'].forEach((k) => {
      data.settings[k] = f[k].value;
    });
    data.settings.show_prices = f.show_prices.checked ? 'true' : 'false';
    if (!(await persist())) return;
    flash('Settings saved.');
  });
}

function render() {
  if (!currentUser || !authReady) return;
  setActiveNav();
  const r = route();
  if (r !== 'rooms' && r !== 'restaurant-menu') nested = { type: null, id: null };
  const map = {
    dashboard: renderDashboard,
    hero: renderHero,
    'page-heroes': renderPageHeroes,
    rooms: renderRooms,
    facilities: renderFacilities,
    activities: renderActivities,
    pricing: renderPricing,
    food: renderFood,
    'restaurant-menu': renderMenu,
    videos: renderVideos,
    gallery: renderGallery,
    reviews: renderReviews,
    settings: renderSettings,
  };
  (map[r] || renderDashboard)();
}

function setAuthView(view) {
  if (authLoading) authLoading.style.display = view === 'loading' ? 'flex' : 'none';
  loginScreen.style.display = view === 'login' ? 'flex' : 'none';
  appScreen.style.display = view === 'app' ? 'block' : 'none';
}

async function bootAdmin() {
  const loaded = await window.KalongoContent.load(true);
  data = JSON.parse(JSON.stringify(loaded));
  render();
}

function initUi() {
  document.getElementById('togglePassword')?.addEventListener('click', () => {
    const input = document.getElementById('passwordInput');
    const btn = document.getElementById('togglePassword');
    const show = input.type !== 'text';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Hide' : 'Show';
  });
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError('');
    if (!isFirebaseConfigured()) {
      loginError('Firebase Authentication is not configured. Add the VITE_FIREBASE_* environment variables on Vercel, then redeploy.');
      return;
    }
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const prevLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in…';
    }
    try {
      await signIn(email, password);
    } catch (err) {
      loginError(authErrorMessage(err));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevLabel || 'Sign in';
      }
    }
  });
  document.getElementById('logout-link').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await logOut();
    } catch (err) {
      flash(authErrorMessage(err), 'error');
    }
    currentUser = null;
    location.hash = '';
    setAuthView('login');
  });
  document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = document.getElementById('mobileMenuToggle');
    const icon = document.getElementById('menuIcon');
    const open = !sidebar.classList.contains('active');
    sidebar.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    toggle.classList.toggle('active', open);
    icon.textContent = open ? '✕' : '☰';
  });
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobile);
  document.getElementById('admin-nav')?.addEventListener('click', () => {
    if (window.innerWidth <= 768) setTimeout(closeMobile, 80);
  });
  window.addEventListener('hashchange', render);
}

function start() {
  setAuthView('loading');
  initUi();
  if (!isFirebaseConfigured()) {
    setAuthView('login');
    loginError('Firebase Authentication is not configured. Add the VITE_FIREBASE_* environment variables on Vercel, then redeploy.');
    return;
  }
  onAuthChange(async (user) => {
    authReady = true;
    currentUser = user;
    if (!user) {
      setAuthView('login');
      return;
    }
    setAuthView('app');
    try {
      await bootAdmin();
    } catch (err) {
      flash(err.message || 'Could not load site content.', 'error');
    }
  });
}

start();
