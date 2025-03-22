
export interface IBaseEntity {
    id: number;
  }
  
  export interface IBooking extends IBaseEntity {
    date?: string;  
    time?: string;  
    reserved: boolean;
    idService: number;
  }
  
  export interface IService extends IBaseEntity {
    nameService: string;
    horarios: string[]; 
    bookings?: IBooking[];
  }
  