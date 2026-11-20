(function () {
    const dialog = document.querySelector('.site-search');
    if (!dialog) return;
    const input = dialog.querySelector('input');
    const results = dialog.querySelector('.site-search-results');
    const status = dialog.querySelector('.search-status');
    const more = dialog.querySelector('.search-more');
    const names = {article:'文章', moment:'动态', page:'页面'};
    let data, pending, type = 'all', timer, composing = false, expanded = false, selected = -1, revision = 0, opener;
    function normalize(text) { return String(text || '').normalize('NFKC').toLowerCase(); }
    function tokens(query) { return Array.from(new Set(normalize(query).trim().split(/\s+/).filter(Boolean))); }
    function rank(records, query, filter) {
        const terms = tokens(query);
        if (!terms.length) return [];
        return records.filter(p => filter === 'all' || p.type === filter).map(p => {
            const title = normalize(p.title), meta = normalize([...(p.tags || []), ...(p.categories || [])].join(' ')), body = normalize(p.content);
            if (!terms.every(t => title.includes(t) || meta.includes(t) || body.includes(t))) return null;
            let score = title === normalize(query).trim() ? 1000 : 0;
            terms.forEach(t => {score += (title.includes(t)?100:0)+(meta.includes(t)?30:0)+(body.includes(t)?5:0);});
            return {p, score};
        }).filter(Boolean).sort((a,b)=>b.score-a.score || String(b.p.date).localeCompare(String(a.p.date)));
    }
    function highlight(node, text, terms) {
        const escaped = terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length);
        if (!escaped.length) { node.textContent = text; return; }
        const regex = new RegExp(escaped.join('|'), 'gi');
        let last = 0, match;
        while ((match = regex.exec(text))) {
            node.appendChild(document.createTextNode(text.slice(last,match.index)));
            const mark = document.createElement('mark'); mark.textContent=match[0];node.appendChild(mark);last=regex.lastIndex;
        }
        node.appendChild(document.createTextNode(text.slice(last)));
    }
    function load() {
        if (data) return Promise.resolve(data);
        if (!pending) pending = fetch(dialog.dataset.index, {cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('index');return r.json();}).then(records=>{if(!Array.isArray(records))throw Error('index'); data=records;return data;}).catch(error=>{pending=null;throw error;});
        return pending;
    }
    async function search() {
        const ticket = ++revision, query=input.value.trim();
        selected=-1;results.replaceChildren();more.hidden=true;
        if (!query) {status.textContent='';return;}
        status.textContent='正在加载搜索…';
        let records;
        try {records=await load();} catch (_) {if(ticket===revision)status.textContent='搜索加载失败，请重新搜索重试';return;}
        if(ticket!==revision || !dialog.open) return;
        const matched=rank(records,query,type), terms=tokens(query), visible=expanded?matched:matched.slice(0,8);
        status.textContent=matched.length?'找到 '+matched.length+' 条结果':'没有找到结果，试试减少关键词或切换类型';
        visible.forEach(({p},index)=>{
            const link=document.createElement('a');link.href=p.path;link.className='search-result';link.style.setProperty('--result-delay',Math.min(index,7)*35+'ms');
            const heading=document.createElement('strong');highlight(heading,p.title,terms);
            const meta=document.createElement('span');meta.className='search-result-meta';meta.textContent=names[p.type]+' · '+p.date;
            const snippet=document.createElement('p'), body=p.content || '', lower=normalize(body);
            const positions=terms.map(t=>lower.indexOf(t)).filter(i=>i>=0);const start=Math.max(0,(positions.length?Math.min(...positions):0)-35);
            highlight(snippet,(start?'…':'')+body.slice(start,start+150)+(body.length>start+150?'…':''),terms);
            link.append(heading,meta,snippet);results.appendChild(link);
        });
        more.hidden=expanded || matched.length<=8;
        more.textContent='查看全部 '+matched.length+' 条结果';
    }
    function open() {if(dialog.open)return;opener=document.activeElement;dialog.showModal();input.focus();load().catch(()=>{});search();}
    let closeTimer;
    function close(){
        if (!dialog.open || dialog.classList.contains('is-closing')) return;
        revision++;
        clearTimeout(timer);
        function finish(){
            clearTimeout(closeTimer);
            dialog.close();
            dialog.classList.remove('is-closing');
            if(opener && opener.isConnected) opener.focus();
        }
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
        dialog.classList.add('is-closing');
        closeTimer=setTimeout(finish,180);
    }
    document.querySelector('.search-btn').addEventListener('click',open);
    dialog.querySelector('.search-close').addEventListener('click',close);
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    dialog.querySelector('form').addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);expanded=true;search();});
    input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer);revision++;});
    function schedule(){if(composing)return;revision++;clearTimeout(timer);expanded=false;timer=setTimeout(search,150);}
    input.addEventListener('compositionend',()=>{composing=false;schedule();});input.addEventListener('input',schedule);
    dialog.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>{type=button.dataset.type;dialog.querySelectorAll('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));expanded=false;search();}));
    more.addEventListener('click',()=>{expanded=true;search();});
    document.addEventListener('keydown',e=>{
        if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dialog.open?close():open();return;}
        if(!dialog.open||e.isComposing||composing)return;
        const links=Array.from(results.querySelectorAll('a'));
        if((e.key==='ArrowDown'||e.key==='ArrowUp')&&links.length){e.preventDefault();const current=links.indexOf(document.activeElement);if(current>=0)selected=current;selected=selected<0?(e.key==='ArrowDown'?0:links.length-1):(selected+(e.key==='ArrowDown'?1:-1)+links.length)%links.length;links.forEach((l,i)=>l.classList.toggle('is-selected',i===selected));links[selected].focus();links[selected].scrollIntoView({block:'nearest'});}
    });
})();
