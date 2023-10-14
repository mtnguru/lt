
import { Box } from '@chakra-ui/react'

import './Checkbox.scss'
import Checkbox from './Checkbox.js'

function CheckboxList (props) {
//for (let item in props.list) {
//  console.log(props.list[item]);
//}
  const onChangeH = (event) => {
    console.log('CheckBoxList::onChangeH - ',event.target.id, event.target.checked)
    props.onChangeH(event)
  }
  return (
    <Box className='checkbox-list'>
      {Object.keys(props.list).map(key => {
        return <Checkbox onChangeH={onChangeH} className={key} key={key} id={key}
                         type={props.list[key]} />
      })}
    </Box>
  );
}

export default CheckboxList;
/*
return <Checkbox onChangeH={onChangeH} className={key} key={key} name={props.list[key]} />
*/
