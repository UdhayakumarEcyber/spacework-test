import * as React from "react";
import { registerWidget, registerLink, registerUI, IContextProvider, } from './uxp';
import { TitleBar, Popover,AsyncButton,FilterPanel, WidgetWrapper, IWizardStep, ModalWizard, Button, IModalWizardStep, useFields, TimeRangePicker, Input, DatePicker, IModalWizardStepProps, Loading, DateTimePicker, ProfileImage, DynamicSelect, ItemCard, IDataFunction, useToast } from "uxp/components";
import './styles.scss';
function delay(n:number) {
    return new Promise((dope,nope)=>{
        setTimeout(()=>dope(),n);
    });
}
interface IWidgetProps {
    uxpContext?: IContextProvider;
    onClose:()=>void;
}


const RoomBookingWizard: React.FunctionComponent<IWidgetProps> = (props) => {

    let [txt,setTxt] = React.useState('');
    let [txt1,setTxt1] = React.useState('');
    let [loadingSearch,setLoadingSearch] = React.useState(false);
    let [facilities,setFacilities] = React.useState<any>([]);
    let [submission,setSubmission] = React.useState<any>(null);
    let steps:IModalWizardStep[] = [];
    let [field,updateField,allFields,setAllFields] = useFields({
        'query':'',
        'startDateSearch':null,
        startTimeSearch:null,
        endTimeSearch:null,
        facility:null,
        visitors:[],
        startDate:null,
        startTime:null,
        endTime:null,
        ac:false,
        agenda:''});
    let [addons,updateAddons,allAddons,setAllAddons] = useFields({
        ahac:false,
        visitors:[],
    });
    let Toast = useToast();
    React.useEffect(()=>{

        triggerSearch();
    },[field.query,field.startDateSearch,field.endDateSearch]);
    async function triggerSearch() {
        let start = null
        let end = null;
        if (field.startDateSearch) {
            start = field.startDateSearch;
            end = field.startDateSearch;

            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);

            end.setHours(0);
            end.setMinutes(0);
            end.setSeconds(0);


        }
        if (field.startTimeSearch) {
            start.setHours(field.startTimeSearch.getHours());
            start.setMinutes(field.startTimeSearch.getMinutes());
        }
        if (field.endTimeSearch) {
            end.setHours(field.endTimeSearch.getHours());
            end.setMinutes(field.endTimeSearch.getMinutes());
        }

        if (start && end) {
            start = start.toISOString();
            end = end.toISOString();
        }
   
        let args = {'name':field.query,start,end};
        console.log('Qurting',start,end);
        setLoadingSearch(true);
        let result= await props.uxpContext.executeAction('OfficeRND.MeetingRoomAnalytics','FindRoom',args,{json:true});
        setLoadingSearch(false);
        setFacilities(result);
    }
    function renderFacilityResult(facility:any,onSelect:()=>void) {
        return <div className='result'>
            <Popover position={"top"} title='Description' content={()=>(
            <div className='facility-tooltip'>{facility.description}</div>)}>
                <div className='image' style={{backgroundImage:`url(${facility.image})`}} />
            </Popover>
            <div className='capacity'>{facility.size+' pax'}</div>
            <div className='name'>{facility.name}</div>
            <AsyncButton title='Book' onClick={async ()=>{
                setAllFields(Object.assign({},allFields,{facility,startDate:field.startDateSearch,startTime:field.startTimeSearch,endTime:field.endTimeSearch}));
                await delay(200);
                onSelect();
                
            }} />
        </div>
    }
    function renderResults(onSelect:()=>void) {
        if (facilities.length==0) return <div className='nodata'>No results found</div>;
        return <>
        {
            facilities.map((f:any) => renderFacilityResult(f,onSelect))
        }
        </>
    }
    function renderHome(wp:IModalWizardStepProps) {
        return <div className='home vflex-mt-sb'>
            <div className='flex-sl-s-mr'>
                <Input className={'search'} value={allFields.query} onChange={updateField.query} placeholder={'Search Facilities'} />
                <FilterPanel>
                    <div style={{margin:'20px'}}>

                    <DatePicker date={field.startDateSearch} onChange={updateField.startDateSearch}
                    title={'Date'} />
                    </div>
                    <div style={{margin:'20px'}}>
                    <TimeRangePicker title={'Time'} endTime={field.endTimeSearch} startTime={field.startTimeSearch} onChange={(s,e)=>{
                        setAllFields(Object.assign({},allFields,{startTimeSearch:s,endTimeSearch:e}));

                    }}
                 />
                 </div>
                </FilterPanel>
            </div>
            <div style={{marginTop:'50px'}}>{'Available ' + (facilities.length==0?'':' - ' + facilities.length) }</div>
            <div className='search-results'>
                    {
                        loadingSearch?<Loading />:renderResults(wp.next)
                    }
            </div>
        </div>
    }
    /*function renderTimeSelection(wp:IModalWizardStepProps) {
        return <div className='select-time'>
            <div className='slot-duration'>
                <div className='duration'>30-min Slots</div>
                <div className='slots'>
                    <div className='slot'>9:30-10:00</div>
                    <div className='slot'>10:00-10:30</div>
                    <div className='slot'>10:30-11:00</div>
                    <div className='slot'>13:345-14:15</div>
                </div>
            </div>
            <div className='slot-duration'>
                <div className='duration'>1 hour Slots</div>
                <div className='slots'>
                    <div className='slot'>9:30-10:30</div>
                    <div className='slot'>10:00-11:00</div>
                    <div className='slot'>10:30-11:30</div>
                </div>
            </div>
            <div className='slot-duration'>
                <div className='duration'>2 hour Slots</div>
                <div className='slots'>
                    <div className='slot'>9:30-11:30</div>
                </div>
            </div>
        </div>
    }*/
    function renderDateSelection(wp:IModalWizardStepProps) {
            return <div className='select-date'>
                <div>Lets confirm the date for your booking</div>
                <DatePicker date={field.startDate} onChange={updateField.startDate} title='Pick a Date'/>
            </div>
    }
    function renderTimeSelection(wp:IModalWizardStepProps) {
        return <div className='select-date'>
            <div>This is the timing for your booking</div>
            <TimeRangePicker startTime={field.startTime} endTime={field.endTime} onChange={(s,e)=>{
                setAllFields(Object.assign({},allFields,{startTime:s,endTime:e}));
            }} title='Pick a Time Range'/>
        </div>
    }
    function renderAgenda(wp:IModalWizardStepProps) {
        return <div className='select-date'>
            <div>Do you have an agenda for this meeting?</div>
            <Input value={field.agenda} onChange={updateField.agenda} placeholder={"What's this meeting about?"} />
        </div>
    }
    function renderAHAC(wp:IModalWizardStepProps) {
        return <div className='ahac vflex-middle' style={{}} >
            <div style={{width:'300px',marginLeft:'auto',marginRight:'auto'}}>
            <div className='ahac-icon'></div>
            <div style={{marginBottom:'50px'}} >Your meeting might extend beyond normal hours. Do you want to request an AC extension?</div>
            <div className='flex-sl-s-mr'>
                <Button title={'Skip'} 
                onClick={()=>{
                    updateAddons.ahac(false);
                    wp.next();
                }} 
                />
                <Button title={'Yes Please'} 
                onClick={()=>{
                    updateAddons.ahac(true);
                    wp.next();
                }} 
                />
            </div>
                </div>
        </div>
    }
    let getVisitorSource:IDataFunction = props.uxpContext.fromLucyDataCollection('VisitorModel','PartnerVisitsInfo');
    let getVisitors:IDataFunction = (max:number,lastPageToken:string,args?:any) => {
        let queryArgs = {};
        if (args?.query) {

           queryArgs = {"VisitorName": {"$regex": '.*' + args.query+'.*','$options':'i'}};
        }
        return getVisitorSource(max,lastPageToken,queryArgs);
    }
    function renderVisitors(wp:IModalWizardStepProps) {
            return <div className='visitor-list' style={{width:'500px'}}>
                <div style={{marginTop:'30px'}}>
            <div className='visitor-icon'></div>
                <div className='lbl' style={{marginBottom:'10px'}}>Would you like to invite some visitors?</div>
                <DynamicSelect selected={null} options={getVisitors} 
                renderOption={(item:any)=>{
                    console.log(item);
                    return <ItemCard className={'visitor-item'} item={item} nameField={'VisitorName'} titleField={'VisitorName'} subTitleField={'Email'} />
                }}
                labelField={'VisitorName'}
                onChange={(v)=>{
                    updateAddons.visitors(addons.visitors.concat({name:v.VisitorName,email:v.Email}));
                }}
                />
                </div>
                <div className='selected' style={{display:'flex',marginTop:'20px'}}>
                    {
                        (addons?.visitors || []).map((v:any,vi:number) => {
                            return <div>
                                <Popover title={''} content={()=><Button title={'Remove ' + v.name} onClick={()=>updateAddons.visitors(addons.visitors.filter((xv:any)=>xv.email!=v.email))} />}>

                                <ProfileImage name={v.name} />
                                </Popover>
                                </div>
                        })
                    }

                </div>
            </div>;
    }

    function renderDateTimeSummary() {
        let days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        let months = ['Jan','Feb','March','April','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
        if (!field.startDate) return null;
        let s = field.startDate.getDay() + ", " + days[field.startDate.getDay()] + " " + months[field.startDate.getMonth()];
        if (field.startTime) {
            s += ' ' + field.startTime.getHours()+":" + field.startTime.getMinutes();
            if (field.endTime) {
                s += ' - ' + field.endTime.getHours()+":" + field.endTime.getMinutes();
            }
        }
        return s;

    }

    function renderSubHeader() {
        return <div className='sub-header' style={{backgroundImage:`url(${field?.facility?.image})`}}>
            <div className='label'>{field?.facility?.name}</div>
        </div>
    }

    async function submit() {
        return completeBooking();
    }
    async function completeBooking() {
        try {

            let obj = field.facility;
            let startDate = new Date(field.startDate);
            if (!field.startTime) {
                alert('No start time has been set');
                return;
            }
            if (!field.endTime) {
                alert('No start time has been set');
                return;
            }
            startDate.setHours(field.startTime.getHours());
            startDate.setMinutes(field.startTime.getMinutes());
            let endDate =  new Date(field.startDate);
            endDate.setHours(field.endTime.getHours());
            endDate.setMinutes( field.endTime.getMinutes());
        let r = await props.uxpContext.executeAction('OfficeRND.MeetingRoomAnalytics','BookRoom', {
            'id':obj._id,
            summary:field.agenda,
            starts:startDate.toISOString(),
            ends:endDate.toISOString(),
            ahac:!!field.ahac,
            visitors:field.visitors.map((v:any)=>v.email).join(',')
        },{json:true});
        setSubmission(r);
    Toast.success("Booking has been confirmed");
        } catch(e) {
            Toast.error(''+e);
        }

     

    }
    function renderSubmission() {
        return <div style={{marginTop:'50px'}}>Submitted</div>;
    }
    function renderSubmissionSummary() {
        if (submission) {
            return renderSubmission();
        }
        return <div className='summary vflex-middle'>
            <div className='label' style={{marginBottom:'30px;'}}>All set. Please review the details on the left and then hit Submit</div>
            <AsyncButton title={'Submit'} onClick={submit} />
        </div>
    }

    steps.push({
        render:(wp)=>renderHome(wp),
        renderStatus:() => <div>{field?.facility?.name}</div>,
        title:'Facility',
        showStatus:false,
        showNext:false,

    });
    steps.push({
        render:(wp)=>renderDateSelection(wp),
        renderStatus:() => <div>{renderDateTimeSummary()}</div>,
        renderSubHeader,
        title:'Date',
        showStatus:true,
        showNext:true,

    });
    steps.push({
        render:(wp)=>renderTimeSelection(wp),
        renderStatus:() => null,//<div>{(field?.startDate?.toString())|| ''}</div>,
        renderSubHeader,
        title:'Time',
        showStatus:true,
        showNext:true,

    });
    steps.push({
        render:(wp)=>renderAgenda(wp),
        renderStatus:() => <div>{field?.agenda || ''}</div>,
        renderSubHeader,
        title:'Agenda',
        showStatus:true,
        showNext:true,

    });
    steps.push({
        render:(wp)=>renderAHAC(wp),
        renderStatus:() => <div>{addons?.ahac?'Requested':'Not Required'}</div>,
        renderSubHeader,
        title:'Add-On: Aircon After Hours',
        showStatus:true,
        showNext:false,

    });
    steps.push({
        render:(wp)=>renderVisitors(wp),
        renderStatus:() => <div style={{display:'flex'}}>{(addons?.visitors || []).map((v:any)=><ProfileImage name={v.name} />)}</div>,
        title:'Add-On:Visitors',
        renderSubHeader,
        showStatus:true,
        showNext:true,

    });

    steps.push({
        render:(wp)=>renderSubmissionSummary(),
        renderSubHeader,
        renderStatus:()=>null,
        title:'Summary',
        showStatus:true,
        showNext:false,
    });
  
    return (
        
            <ModalWizard
            className='room-booking'
            onClose={()=>props.onClose()}
            onComplete={()=>delay(1000)}
            completionText={'Done'}
            title='Book a room'
            show={true}
            steps={steps}

            />
     
    );
};
const RoomBookingAction: React.FunctionComponent<IWidgetProps> = (props) => {
    let [show,setShow] = React.useState(false);
    return (
        <>
        <WidgetWrapper>

            <div className='action-widget room-action' onClick={()=>setShow(true)}>

                <div className='icon fb-icon' />
                <div className='lbl'>Book a Meeting</div>


            </div>
        </WidgetWrapper>
        {
            show &&
            <RoomBookingWizard uxpContext={props.uxpContext}  onClose={()=>setShow(false)} />
        }
        </>
    );
};

/**
 * Register as a Widget
 */
registerWidget({
    id: "room-booking-action",
    name: "Room Booking Action",
    widget: RoomBookingAction,
    configs: {
        layout: {
            w: 4,
             h: 4,
            // minH: 12,
            // minW: 12
        }
    }
});

/**
 * Register as a Sidebar Link
 */

registerLink({
    id: "room-booking-link",
    label: "Book a Room",
    // click: () => alert("Hello"),
    component: RoomBookingWizard,
    icon:"https://uxp.s3.amazonaws.com/public/images/facility-icon.png"

});


/**
 * Register as a UI
 */

 /*
registerUI({
    id:"room_booking",
    component: Room_bookingWidget
});
*/