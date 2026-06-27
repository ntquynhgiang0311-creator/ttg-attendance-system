async function loadAttendance(){

    const res = await fetch(

        API_URL +

        "?action=attendance"

    );

    const ds = await res.json();

    ds.reverse();

    let html = "";

    ds.forEach(x=>{

        html += `

        <tr>

            <td>

                ${x.time}

            </td>

            <td>

                ${x.hoten}

            </td>

            <td>

                ${x.congtrinh}

            </td>

            <td>

                ${x.type}

            </td>

            <td>

                ${x.distance} m

            </td>

        </tr>

        `;

    });

    document.getElementById(

        "tableAttendance"

    ).innerHTML = html;

}

loadAttendance();