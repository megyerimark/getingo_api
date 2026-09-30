import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth';
import { BuddyRoomKey, CompanionActionKey, CompanionState, CompanionSkin } from '../../core/models/companion.model';
import { CompanionService } from '../../services/companion';
import { Buddy3D } from '../../shared/buddy-3d/buddy-3d';

@Component({
  selector: 'app-buddy',
  imports: [RouterLink, Buddy3D],
  templateUrl: './buddy.html',
  styleUrl: './buddy.scss'
})
export class Buddy implements OnInit {
  @ViewChild(Buddy3D) buddy3d?: Buddy3D;
  state: CompanionState | null = null;
  loading = true;
  action: CompanionActionKey | null = null;
  message = '';
  error = '';

  constructor(public auth: Auth, private companionService: CompanionService) {}

  ngOnInit(): void { this.load(); }

  get room(): BuddyRoomKey { return this.state?.companion.selected_room ?? 'studio'; }
  get premium(): boolean { return this.auth.currentUser()?.is_premium === true; }

  load(): void {
    this.loading = true;
    this.companionService.getState().pipe(finalize(() => this.loading = false)).subscribe({
      next: state => this.state = state,
      error: () => this.error = 'Pixel 3D szobája most nem tölthető be.'
    });
  }

  care(action: CompanionActionKey): void {
    if (this.action) return;
    this.action = action; this.message=''; this.error='';
    this.companionService.performAction(action).pipe(finalize(() => this.action=null)).subscribe({
      next: response => { this.state=response.state; this.message=response.message; setTimeout(() => this.buddy3d?.playAction(action)); },
      error: err => this.error=err?.error?.errors?.action?.[0] ?? err?.error?.message ?? 'A művelet nem sikerült.'
    });
  }

  switchRoom(room: BuddyRoomKey): void {
    if (!this.state || room === this.room) return;
    this.companionService.updatePreferences({ room }).subscribe({ next: state => this.state=state, error: () => this.error='A szoba mentése nem sikerült.' });
  }

  selectSkin(skin: CompanionSkin): void {
    if (!skin.unlocked || !this.state) return;
    this.companionService.updatePreferences({ skin: skin.key }).subscribe({ next: state => this.state=state, error: err => this.error=err?.error?.errors?.skin?.[0] ?? 'A skin nem választható.' });
  }

  pet(): void { this.buddy3d?.pet(); this.message='Pixel élvezi a simogatást.'; }
  rest(): void { this.buddy3d?.rest(); this.message='Pixel lepihen egy kicsit.'; }
  actionCost(action: CompanionActionKey): number { return this.state?.actions.find(item=>item.key===action)?.cost ?? 0; }
  tip(): string { if(!this.state)return ''; const c=this.state.companion; const min=Math.min(c.water,c.hunger,c.happiness); return min===c.water?'Pixel megszomjazott.':min===c.hunger?'Pixel enne valamit.':'Pixel játszana veled.'; }
}
