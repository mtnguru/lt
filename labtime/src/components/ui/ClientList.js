// import './ClientList.scss'
import Client from './Client.js'

function ClientList (props) {
//for (let item in props.list) {
//  console.log(props.list[item]);
//}
  const onChangeH = (event) => {
    console.log('ClientList::onChangeH - ',event.target.id, event.target.checked)
    props.onChangeH(event)
  }
  return (
    <div className='client-list'>
      {Object.keys(props.list).map(key => {
        return <Client onChangeH={onChangeH} className={key} key={key} id={key}
                         name={props.list[key].name} selected={props.list[key].selected} />
      })}
    </div>
  );
}

export default ClientList;
/*
return <Checkbox onChangeH={onChangeH} className={key} key={key} name={props.list[key]} />
*/
