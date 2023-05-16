import './Card.scss'

function Card(props) {
  return <div className={`card ${props.funcType} ${props.className}`}>{props.children}</div>

}

export default Card;