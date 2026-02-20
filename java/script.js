// Interactive script for Expense Tracker (moved to java/script.js)
// Features: add expense, render list, persist to localStorage, remove expense, date filtering, charts
(function(){
	const STORAGE_KEY = 'expenses_v1';
	let expenses = [];
	const DEFAULT_CATEGORIES = ['Uncategorized','Food','Transport','Shopping','Utilities','Other'];

	// Charts
	let categoryChart = null;
	let timeChart = null;

	// Date filter state (ISO yyyy-mm-dd)
	let filterStart = null;
	let filterEnd = null;

	function getExpenses(){
		try{
			const raw = localStorage.getItem(STORAGE_KEY);
			return raw ? JSON.parse(raw) : [];
		}catch(e){
			console.error('Failed to parse expenses from storage', e);
			return [];
		}
	}

	function saveExpenses(){
		try{
			localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
		}catch(e){
			console.error('Failed to save expenses', e);
		}
	}

	function formatCurrency(num){
		const n = Number(num) || 0;
		return 'R' + n.toFixed(2);
	}

	function generateId(){
		return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
	}

	// Migration: ensure stored items include category and date
	function migrate(raw){
		if(!Array.isArray(raw)) return [];
		return raw.map(item => {
			// old format: {id,title,amount}
			const migrated = Object.assign({}, item);
			if(!migrated.category) migrated.category = 'Uncategorized';
			// if date missing, set to today (ISO date)
			if(!migrated.date){
				const d = new Date();
				migrated.date = d.toISOString().slice(0,10);
			}
			// ensure amount is number
			migrated.amount = Number(migrated.amount) || 0;
			return migrated;
		});
	}

	function getFilteredExpenses(){
		if(!filterStart && !filterEnd) return expenses.slice();
		return expenses.filter(e => {
			const d = e.date || '';
			if(filterStart && d < filterStart) return false;
			if(filterEnd && d > filterEnd) return false;
			return true;
		});
	}

	function render(){
		const list = document.getElementById('expense-list');
		const totalEl = document.getElementById('total');
		if(!list || !totalEl) return;
		list.innerHTML = '';
		let total = 0;
		const visible = getFilteredExpenses();
		visible.forEach(exp => {
			total += Number(exp.amount) || 0;

			const li = document.createElement('li');

			const meta = document.createElement('div'); meta.className = 'meta';
			const title = document.createElement('div'); title.className = 'title'; title.textContent = exp.title;
			const amt = document.createElement('div'); amt.className = 'amt'; amt.textContent = formatCurrency(exp.amount);
			const extra = document.createElement('div'); extra.className = 'amt'; extra.textContent = exp.category + ' • ' + exp.date;
			meta.appendChild(title); meta.appendChild(amt); meta.appendChild(extra);

			const actions = document.createElement('div'); actions.className = 'actions';
			const del = document.createElement('button'); del.className = 'btn-delete'; del.setAttribute('aria-label','Delete expense'); del.textContent = 'Delete';
			del.addEventListener('click', () => removeExpense(exp.id));
			actions.appendChild(del);

			li.appendChild(meta);
			li.appendChild(actions);
			list.appendChild(li);
		});

		totalEl.textContent = formatCurrency(total);

		updateCharts();
	}

	function addExpense(title, amount, category, date){
		const t = String(title || '').trim();
		const a = Number(amount);
		const c = category || 'Uncategorized';
		const d = date || (new Date()).toISOString().slice(0,10);
		if(!t || !isFinite(a)) return false;
		const exp = { id: generateId(), title: t, amount: a, category: c, date: d };
		expenses.push(exp);
		saveExpenses();
		render();
		return true;
	}

	function removeExpense(id){
		expenses = expenses.filter(e => e.id !== id);
		saveExpenses();
		render();
	}

	// Chart helpers
	function groupByCategory(list){
		const map = new Map();
		(list||[]).forEach(e => {
			const k = e.category || 'Uncategorized';
			map.set(k, (map.get(k) || 0) + Number(e.amount || 0));
		});
		return Array.from(map.entries()).sort((a,b) => b[1]-a[1]);
	}

	function groupByMonth(list){
		// produce { 'YYYY-MM': total }
		const map = new Map();
		(list||[]).forEach(e => {
			const m = (e.date || '').slice(0,7) || (new Date()).toISOString().slice(0,7);
			map.set(m, (map.get(m) || 0) + Number(e.amount || 0));
		});
		// sort keys ascending
		return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
	}

	function createOrUpdateCategoryChart(filtered){
		const data = groupByCategory(filtered);
		const labels = data.map(d=>d[0]);
		const values = data.map(d=>d[1]);
		const ctx = document.getElementById('chart-category');
		if(!ctx) return;
		if(categoryChart){
			categoryChart.data.labels = labels;
			categoryChart.data.datasets[0].data = values;
			categoryChart.update();
			return;
		}
		categoryChart = new Chart(ctx.getContext('2d'), {
			type: 'doughnut',
			data: {
				labels: labels,
				datasets: [{
					data: values,
					backgroundColor: [
						'#60a5fa','#34d399','#f97316','#f472b6','#fca5a5','#d1fae5','#a78bfa'
					]
				}]
			},
			options: { responsive:true, maintainAspectRatio:false }
		});
	}

	function createOrUpdateTimeChart(filtered){
		const data = groupByMonth(filtered);
		const labels = data.map(d=>d[0]);
		const values = data.map(d=>d[1]);
		const ctx = document.getElementById('chart-time');
		if(!ctx) return;
		if(timeChart){
			timeChart.data.labels = labels;
			timeChart.data.datasets[0].data = values;
			timeChart.update();
			return;
		}
		timeChart = new Chart(ctx.getContext('2d'), {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: 'Spending',
					data: values,
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59,130,246,0.15)',
					fill:true,
					tension:0.2
				}]
			},
			options: { responsive:true, maintainAspectRatio:false }
		});
	}

	function updateCharts(){
		const visible = getFilteredExpenses();
		createOrUpdateCategoryChart(visible);
		createOrUpdateTimeChart(visible);
	}

	function init(){
		// load and migrate
		const raw = getExpenses();
		expenses = migrate(raw);

		// ensure category options in the form include any categories used
		const categorySelect = document.getElementById('category');
		if(categorySelect){
			const used = new Set(DEFAULT_CATEGORIES.concat(expenses.map(e => e.category)));
			categorySelect.innerHTML = '';
			Array.from(used).forEach(c => {
				const opt = document.createElement('option'); opt.value = c; opt.textContent = c; categorySelect.appendChild(opt);
			});
		}

		// set default date to today
		const dateInput = document.getElementById('date');
		if(dateInput && !dateInput.value){ dateInput.value = (new Date()).toISOString().slice(0,10); }

		// set default filter to last 6 months
		const end = new Date();
		const start = new Date(); start.setMonth(end.getMonth()-6);
		filterStart = start.toISOString().slice(0,10);
		filterEnd = end.toISOString().slice(0,10);
		const filterStartInput = document.getElementById('filter-start');
		const filterEndInput = document.getElementById('filter-end');
		if(filterStartInput) filterStartInput.value = filterStart;
		if(filterEndInput) filterEndInput.value = filterEnd;

		// wire filter buttons
		const applyBtn = document.getElementById('apply-filter');
		const clearBtn = document.getElementById('clear-filter');
		if(applyBtn){
			applyBtn.addEventListener('click', () => {
				const s = document.getElementById('filter-start').value;
				const e = document.getElementById('filter-end').value;
				filterStart = s || null; filterEnd = e || null; render();
			});
		}
		if(clearBtn){
			clearBtn.addEventListener('click', () => {
				filterStart = null; filterEnd = null;
				const s = document.getElementById('filter-start'); if(s) s.value = '';
				const e = document.getElementById('filter-end'); if(e) e.value = '';
				render();
			});
		}

		const form = document.getElementById('expense-form');
		if(form){
			form.addEventListener('submit', (ev) => {
				ev.preventDefault();
				const title = document.getElementById('title').value;
				const amount = document.getElementById('amount').value;
				const category = document.getElementById('category').value;
				const date = document.getElementById('date').value;
				if(addExpense(title, amount, category, date)){
					form.reset();
					// restore date to today
					document.getElementById('date').value = (new Date()).toISOString().slice(0,10);
					document.getElementById('title').focus();
				} else {
					alert('Please provide a valid title and numeric amount');
				}
			});
		}

		// wire header buttons: export CSV and clear all
		const exportBtn = document.getElementById('export-csv');
		if(exportBtn) exportBtn.addEventListener('click', exportCSV);
		const clearAllBtn = document.getElementById('clear-all');
		if(clearAllBtn) clearAllBtn.addEventListener('click', clearAll);

		render();
	}


	// Export expenses as CSV (all expenses, not filtered)
	function exportCSV(){
		try{
			const rows = [['id','title','amount','category','date']];
			const data = expenses.map(e => [e.id, e.title, e.amount, e.category, e.date]);
			const csv = rows.concat(data).map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url; a.download = 'expenses.csv'; document.body.appendChild(a); a.click(); a.remove();
			URL.revokeObjectURL(url);
		}catch(e){ console.error('Export failed', e); alert('Export failed: ' + e.message); }
	}

	function clearAll(){
		if(!confirm('Clear ALL expenses? This cannot be undone.')) return;
		expenses = [];
		saveExpenses();
		render();
	}

	document.addEventListener('DOMContentLoaded', init);

	// expose a small API for debugging/testing in the console
	window.ExpenseApp = {
		addExpense,
		removeExpense,
		getExpenses: () => expenses.slice(),
		_clear: () => { expenses = []; saveExpenses(); render(); }
	};

})();
