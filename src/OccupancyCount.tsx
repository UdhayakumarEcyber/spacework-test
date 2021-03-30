import * as React from "react";
import { debounce, IContextProvider } from './uxp';
import { WidgetWrapper, MapComponent, Select, DateTimePicker, DropDownButton, ToggleFilter, DatePicker, IconButton, Loading, IMarker, useUpdateWidgetProps } from "uxp/components";

interface IWidgetProps {
    uxpContext?: IContextProvider,
    instanceId?: string,
    zoom?: number,
    center?: { latitude: number, longitude: number }
}

const SpaceOccupancyAnalyticsDisplay: React.FunctionComponent<IWidgetProps> = (props) => {

    let [loading, setLoading] = React.useState(false);
    let [floors, setFloors] = React.useState([]);
    let [floor, setFloor] = React.useState(null);
    let [spaces, setSpaces] = React.useState([]);
    let [occupancy, setOccupancy] = React.useState<any>({});
    let [filterTime, setFilterTime] = React.useState<Date>(new Date());
    let [bucket, setBucket] = React.useState('current');

    let [configs, setConfigs] = React.useState<{ zoom: number, center: { lat: number, lng: number } } | null>(null)

    let updateDefaultProps = useUpdateWidgetProps()

    let getValues = debounce(getLatestValues, 500)
    let refreshValues = debounce(getLatestValues, (60 * 1000))

    React.useEffect(() => {
        props.uxpContext.executeAction('SmartSpace', 'GetFloors', {}, { json: true }).then(data => {
            setFloors(data.map((d: any) => ({ label: d.name, value: d.id, data: d })));
            if (!floor && data.length) {
                setFloor(data[0].id);
            }
        });
    }, []);

    React.useEffect(() => {
        props.uxpContext.executeAction('SmartSpace', 'GetSpaces', { 'floor': floor }, { json: true }).then((data) => {
            setSpaces(data);
        });
    }, [floor]);

    React.useEffect(() => {
        if (!floor) {
            return;
        }
        getValues()
    }, [filterTime, bucket, floor]);

    async function getLatestValues() {
        let action = 'GetOccupancyForFloor';
        let args: any = { floor };
        if (bucket != 'current' && filterTime) {
            action = 'GetHistoricalOccupancyForFloor';
            args['bucket'] = bucket;
            let d = new Date(filterTime);
            d.setMinutes(0);
            d.setSeconds(0);
            d.setMilliseconds(0);
            if (bucket == 'day' || bucket == 'week' || bucket == 'month') {
                d.setHours(0);
            }
            let end = new Date(d);
            if (bucket == 'hour') {
                end.setHours(end.getHours() + 1);
            }
            if (bucket == 'day') {
                end.setDate(end.getDate() + 1);
            }
            if (bucket == 'week') {
                end.setDate(end.getDate() + 7);
            }
            if (bucket == 'month') {
                end.setDate(1);
                end.setMonth(end.getMonth() + 1);
            }

            args['start'] = d.toISOString();
            args['end'] = end.toISOString();
        }
        let data = await props.uxpContext.executeAction('SmartSpace', action, args, { json: true });
        console.log('occ: ', data)
        let latestOccupancy: any = {};
        for (var i in data) {
            let d = data[i];
            latestOccupancy[d.id] = Number(d.value);
        }
        setOccupancy(latestOccupancy);
        refreshValues()
    }

    function nextDate(offset: 1 | -1) {
        if (bucket == 'current') return;
        let d = new Date(filterTime);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        if (bucket == 'hour') {
            d.setHours(d.getHours() + offset);
        }
        if (bucket == 'day') {
            d.setHours(0);
            d.setDate(d.getDate() + offset);
        }
        if (bucket == 'week') {
            d.setHours(0);
            d.setDate(d.getDate() - d.getDay());
            d.setDate(d.getDate() + 7 * offset);
        }
        if (bucket == 'month') {
            d.setHours(0);
            d.setDate(1);
            d.setMonth(d.getMonth() + offset);

        }
        setFilterTime(d);
    }

    function getStatusColor(id: string) {
        let val = Number(occupancy[id]) || 0;
        if (val == 0) return '#424242FF';
        if (val < 3) return '#2CC8B3FF';
        if (val < 6) return '#DDBC52FF';
        if (val < 8) return '#DA7D51FF';
        return '#EC4B7B99';
    }

    var regionCenter = function (arr: number[][]) {
        var minX: number, maxX: number, minY: number, maxY: number;
        for (var i = 0; i < arr.length; i++) {
            minX = (arr[i][0] < minX || minX == null) ? arr[i][0] : minX;
            maxX = (arr[i][0] > maxX || maxX == null) ? arr[i][0] : maxX;
            minY = (arr[i][1] < minY || minY == null) ? arr[i][1] : minY;
            maxY = (arr[i][1] > maxY || maxY == null) ? arr[i][1] : maxY;
        }
        return [(minX + maxX) / 2, (minY + maxY) / 2];
    }

    let markers: IMarker[] = [];

    let floorData = floors.find(x => x.value == floor)?.data;
    let regions: any[] = [];
    let xo = 80;
    let yo = 50;
    for (var i in spaces) {
        let space = spaces[i];
        let c = getStatusColor(space.id);

        let centrePoint = regionCenter(space.region.map((c: any) => [c.x, c.y]));
        markers.push({
            longitude: centrePoint[0],
            latitude: centrePoint[1],
            imageCoordinates: true,
            customHTMLIcon: { className: 'space-icon', html: '<div style="background-color:' + c + '">' + (Number(occupancy[space.id]) || 0) + '</div>' }
        });

    }


    function onZoomEnd(e: any) {
        setConfigs({ zoom: e.target._zoom, center: e.target.getCenter() })
    }

    function onDragEnd(e: any) {
        setConfigs({ zoom: e.target._zoom, center: e.target.getCenter() })
    }

    async function updateProps() {
        let dProps: any = {
            zoom: configs.zoom,
            center: { latitude: configs.center.lat, longitude: configs.center.lng }
        }

        updateDefaultProps(props.instanceId, dProps)
        setConfigs(null)
    }

    let _center: any = {
        position: {
            latitude: floorData?.floorPlanWidth * 0.5,
            longitude: floorData?.floorPlanHeight * 0.5
        },
        renderMarker: false
    }

    if (props.center && props.center.latitude && props.center.longitude) {
        _center.position = props.center
    }

    return (
        <WidgetWrapper className='spa display'>
            {
                (floorData && floorData.floorPlan) ?
                    <MapComponent
                        zoom={props.zoom ? props.zoom : -1}
                        minZoom={-3}
                        center={_center}
                        regions={regions}

                        staticImage={{ 
                            url: floorData.floorPlan, 
                            width: floorData.floorPlanWidth - 180,
                            height: floorData.floorPlanHeight - 120
                        }}
                        onRegionClick={(e: any, data: any) => {

                        }}
                        markers={markers} onMarkerClick={() => { }} mapUrl={''}
                        onZoomEnd={onZoomEnd}
                        onDragEnd={onDragEnd}
                    />
                    : <div className='nomap'>Select a floor to get started</div>
            }

            <div className="header">
                <div className="title">Space Occupancydd</div>
            </div>

            <div className='legend-bar'>
                <div className='legend-status'>
                    <div className='color' style={{ backgroundColor: '#EC4B7B99' }} />
                    <div className='txt'>Very High Density</div>
                </div>
                <div className='legend-status'>
                    <div className='color' style={{ backgroundColor: '#DA7D51FF' }} />
                    <div className='txt'> High Density</div>
                </div>
                <div className='legend-status'>
                    <div className='color' style={{ backgroundColor: '#DDBC52FF' }} />
                    <div className='txt'>Medium Density</div>
                </div>
                <div className='legend-status'>
                    <div className='color' style={{ backgroundColor: '#2CC8B3FF' }} />
                    <div className='txt'>Low Density</div>
                </div>
            </div>


            {
                configs != null && <div className="pin-btn-container">
                    <IconButton type="pin" onClick={updateProps} />
                </div>
            }

        </WidgetWrapper>
    )
};

export default SpaceOccupancyAnalyticsDisplay