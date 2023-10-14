//import './Card.scss'

function Card(props) {
  return <div className={`card ${props.funcId} ${props.className}`}>{props.children}</div>

}

export default Card;
