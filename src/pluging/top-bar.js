export default function createTopBar() {
    let div = document.createElement('div')
    div.style.position = "absolute"
    div.style.top = "60px"
    div.style.left = "10px"
    fetch("../list.json")
        .then(res => res.json())
        .then(data => {
            console.log(data.fileNameList);
            let fileList = data.fileNameList;

            div.innerHTML = `
                <select style="height: 23px" name="things" id="things-select">
                    <option>导航</option>
                    ${ fileList.map(item => `<option value="${ item }.html">${ item }</option>`) }
                </select>
            `
            document.body.append(div)
            let select = document.getElementById("things-select");
            select.onchange = ev => {
                console.log(ev.target.value);
                location.href = ev.target.value;
            }
        })
}