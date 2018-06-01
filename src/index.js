
let leftList,rightList,leftSearch,rightSearch,mainBody,friends;

NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach;
VK.init({
    apiId: 6488060
});

(async () => {
    try {
        await auth();
        leftList = document.querySelector('.leftList');
        rightList = document.querySelector('.rightList');
        leftSearch = document.querySelector('.leftSearch input');
        rightSearch = document.querySelector('.rightSearch input');
        mainBody = document.querySelector('.mainBody');
        if(localStorage.friends) {
            friends = JSON.parse(localStorage.friends);
        } else {
            friends = await callAPI('friends.get', {fields: 'photo_50'});
        }

        load();

        leftSearch.addEventListener('input',(e) => {
            leftList.getElementsByTagName('li').forEach((item) => check(item, e.target.value));
        });
        rightSearch.addEventListener('input',(e) => {
            rightList.getElementsByTagName('li').forEach((item) => check(item, e.target.value));
        });

        mainBody.addEventListener('click', changeList);
        makeDND([leftList,rightList]);

        const saveButton = document.querySelector('.save');
        saveButton.addEventListener('click', save);

        const exitButton = document.querySelector('.exit');
        exitButton.addEventListener('click', exit);

    } catch (e) {
        console.error(e);
    }
})();

function auth() {
    return new Promise((resolve, reject) => {
        VK.Auth.login(data => {
            if (data.session) {
                resolve();
            } else {
                reject(new Error('Не удалось авторизоваться'));
            }
        }, 2);
    });
}

function callAPI(method, params) {
    params.v = '5.76';

    return new Promise((resolve, reject) => {
        VK.api(method, params, (data) => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.response);
            }
        });
    })
}

function check(el, val) {
    el.style.display = ~el.textContent.toLowerCase().indexOf(val.toLowerCase()) ? 'block' : 'none';
}

function changeList() {
    let elem, list;

    if (event.target.classList.contains('friendAction')) {
        elem = event.target.parentNode;
        list = elem.parentNode;
        if (list.classList.contains('leftList')) {
            check(elem, rightSearch.value);
            rightList.appendChild(elem);
        } else {
            check(elem, leftSearch.value);
            leftList.appendChild(elem);
        }
    }
}

function load(){
    const template = '{{#each items}} ' +
        '<li class="friend" draggable="true"> ' +
        '<div class="friendPhoto"> ' +
        '<img src="{{photo_50}}" alt="Photo" draggable="false"/> ' +
        '</div><div class="friendName">{{first_name}} {{last_name}}' +
        '</div> <button class="friendAction">' +
        '</button> ' +
        '</li>{{/each}}';
    const render = Handlebars.compile(template);

    if(!friends.items[0].hasOwnProperty('list')) {
        leftList.innerHTML = render(friends);
   } else {
        const left = [],right = [];

        friends.items.forEach((item) => item.list==='rightList' ? right.push(item) : left.push(item));
        leftList.innerHTML = render({count:left.length, items:left});
        rightList.innerHTML = render({count:right.length, items:right});
    }
}

function save(){
    const data = [];

    mainBody.getElementsByTagName('li').forEach((elem) => {
        data.push({first_name: elem.querySelector('.friendName').textContent.split(' ')[0],
                   last_name: elem.querySelector('.friendName').textContent.split(' ')[1],
                   photo_50: elem.querySelector('.friendPhoto img').getAttribute('src'),
                   list: elem.parentNode.classList[0]});
    });
    localStorage.friends = JSON.stringify({count:data.length, items:data});
    alert('Списки друзей сохранены!');
}

function exit(){
    if (confirm('Вы уверены что хотите выйти?')) {
        localStorage.friends = '';
        document.querySelector('.main').style.display = 'none';
        VK.Auth.logout(() => alert('Вы вышли!'));
    }
}

function makeDND(lists){
    let currentItem;

    lists.forEach(list => {
        list.addEventListener('dragstart', (e) => {
            currentItem = {source: list, node: e.target};
        });
        list.addEventListener('dragover', (e)  => {
            e.preventDefault();
        });
        list.addEventListener('drop',(e) => {
            if (currentItem) {
                e.preventDefault();
                if (currentItem.source !== list) {
                    let search = list.classList.contains('rightList') ? rightSearch.value : leftSearch.value;

                    check(currentItem.node, search);
                    list.appendChild(currentItem.node);
                }
                currentItem = null;
            }
        });
    });
}